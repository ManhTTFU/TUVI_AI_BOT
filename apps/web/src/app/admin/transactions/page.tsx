import { getDb, transactions, users } from '@tuvi/db';
import { desc, eq } from 'drizzle-orm';
import TxClient from './TxClient';

export const dynamic = 'force-dynamic';

export default async function AdminTxPage() {
  const db = getDb();
  const rows = await db
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
    .orderBy(desc(transactions.createdAt))
    .limit(200);

  return (
    <TxClient
      initial={rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        completedAt: r.completedAt?.toISOString() ?? null,
      }))}
    />
  );
}
