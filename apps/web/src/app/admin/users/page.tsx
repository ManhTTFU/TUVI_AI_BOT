import { getDb, users } from '@tuvi/db';
import { desc } from 'drizzle-orm';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      role: users.role,
      balanceVnd: users.balanceVnd,
      proUntil: users.proUntil,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(200);

  return (
    <UsersClient
      initialUsers={rows.map((r) => ({
        ...r,
        proUntil: r.proUntil ? r.proUntil.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
