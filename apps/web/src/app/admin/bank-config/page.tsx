import { getDb, bankConfig } from '@tuvi/db';
import { eq } from 'drizzle-orm';
import BankConfigClient from './BankConfigClient';

export const dynamic = 'force-dynamic';

export default async function BankConfigPage() {
  const db = getDb();
  const [cfg] = await db
    .select()
    .from(bankConfig)
    .where(eq(bankConfig.key, 'default'))
    .limit(1);
  return <BankConfigClient initial={cfg ?? null} />;
}
