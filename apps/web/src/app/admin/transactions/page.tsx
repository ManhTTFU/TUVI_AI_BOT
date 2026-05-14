import { getDb, transactions, users } from '@tuvi/db';
import { desc, eq, count, and, type SQL } from 'drizzle-orm';
import TxClient from './TxClient';
import StatsPanel from './StatsPanel';
import { getAdminStats } from '@/lib/admin-stats';

export const dynamic = 'force-dynamic';

const VALID_STATUS = ['pending', 'completed', 'rejected', 'cancelled', 'all'] as const;
type StatusFilter = (typeof VALID_STATUS)[number];

export default async function AdminTxPage({
  searchParams,
}: {
  searchParams: { page?: string; size?: string; status?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1') || 1);
  const size = clamp(parseInt(searchParams.size ?? '20') || 20, 10, 100);
  const rawStatus = searchParams.status ?? 'pending';
  const status: StatusFilter = (VALID_STATUS as readonly string[]).includes(rawStatus)
    ? (rawStatus as StatusFilter)
    : 'pending';

  // Build WHERE. Default `pending` để admin focus duyệt; 'all' bỏ filter.
  const conds: SQL[] = [];
  if (status !== 'all') {
    conds.push(eq(transactions.status, status));
  }
  const where = conds.length > 0 ? and(...conds) : undefined;

  const db = getDb();
  const [rows, totalRes, stats] = await Promise.all([
    db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        userEmail: users.email,
        userName: users.name,
        type: transactions.type,
        status: transactions.status,
        amountVnd: transactions.amountVnd,
        bankRef: transactions.bankRef,
        note: transactions.note,
        createdAt: transactions.createdAt,
        completedAt: transactions.completedAt,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(where)
      .orderBy(desc(transactions.createdAt))
      .limit(size)
      .offset((page - 1) * size),
    db.select({ value: count() }).from(transactions).where(where),
    getAdminStats(),
  ]);

  const total = totalRes[0]?.value ?? 0;

  return (
    <>
      <StatsPanel stats={stats} />
      <TxClient
        initial={rows.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          completedAt: r.completedAt?.toISOString() ?? null,
        }))}
        page={page}
        pageSize={size}
        total={total}
        status={status}
      />
    </>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
