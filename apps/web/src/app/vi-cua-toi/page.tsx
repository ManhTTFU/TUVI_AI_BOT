import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDb, bankConfig, users } from '@tuvi/db';
import { eq } from 'drizzle-orm';
import WalletClient from './WalletClient';
import { getReadingPriceVnd, MIN_TOPUP_VND } from '@/lib/wallet';

export const metadata = { title: 'Ví của tôi · Vận Mệnh' };
export const dynamic = 'force-dynamic';

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/dang-nhap?callbackUrl=/vi-cua-toi');

  const db = getDb();
  const [u] = await db
    .select({ balanceVnd: users.balanceVnd })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const [cfg] = await db
    .select()
    .from(bankConfig)
    .where(eq(bankConfig.key, 'default'))
    .limit(1);

  const readingPrice = await getReadingPriceVnd();

  return (
    <WalletClient
      initialBalance={u?.balanceVnd ?? 0}
      bank={cfg ?? null}
      userName={session.user.name ?? session.user.email ?? ''}
      userEmail={session.user.email ?? ''}
      minTopup={MIN_TOPUP_VND}
      readingPrice={readingPrice}
    />
  );
}
