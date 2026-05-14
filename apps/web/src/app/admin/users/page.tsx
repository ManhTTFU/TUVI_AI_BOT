import { getDb, users } from '@tuvi/db';
import { desc, ilike, or, count, type SQL } from 'drizzle-orm';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string; size?: string; q?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1') || 1);
  const size = clamp(parseInt(searchParams.size ?? '20') || 20, 10, 100);
  const q = (searchParams.q ?? '').trim();

  // Search: case-insensitive partial match trên email + name. Để admin tìm user
  // bằng id cụ thể vẫn hoạt động, dùng ilike với pattern bao trùm cả id (text).
  let where: SQL | undefined;
  if (q) {
    const pat = `%${escapeIlike(q)}%`;
    where = or(ilike(users.email, pat), ilike(users.name, pat), ilike(users.id, pat));
  }

  const db = getDb();
  const [rows, totalRes] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        role: users.role,
        balanceVnd: users.balanceVnd,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(size)
      .offset((page - 1) * size),
    db.select({ value: count() }).from(users).where(where),
  ]);

  const total = totalRes[0]?.value ?? 0;

  return (
    <UsersClient
      initialUsers={rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))}
      page={page}
      pageSize={size}
      total={total}
      searchQuery={q}
    />
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function escapeIlike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => '\\' + c);
}
