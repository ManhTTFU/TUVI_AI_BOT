import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDb, bankConfig, users, subscriptionPlans } from '@tuvi/db';
import { asc, eq } from 'drizzle-orm';
import WalletClient from './WalletClient';

export const metadata = { title: 'Ví của tôi · Diễn Cầm Tam Thế' };
export const dynamic = 'force-dynamic';

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/dang-nhap?callbackUrl=/vi-cua-toi');

  const db = getDb();
  const [u] = await db
    .select({ balanceVnd: users.balanceVnd, proUntil: users.proUntil })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const [cfg] = await db
    .select()
    .from(bankConfig)
    .where(eq(bankConfig.key, 'default'))
    .limit(1);

  const plans = await db
    .select()
    .from(subscriptionPlans)
    .orderBy(asc(subscriptionPlans.sortOrder));

  return (
    <WalletClient
      initialBalance={u?.balanceVnd ?? 0}
      initialProUntil={u?.proUntil ? u.proUntil.toISOString() : null}
      bank={cfg ?? null}
      plans={plans.map((p) => ({
        plan: p.plan,
        amountVnd: p.amountVnd,
        durationDays: p.durationDays,
        label: p.label,
        description: p.description,
        sortOrder: p.sortOrder,
      }))}
      userName={session.user.name ?? session.user.email ?? ''}
    />
  );
}
