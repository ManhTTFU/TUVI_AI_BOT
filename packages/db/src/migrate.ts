/**
 * Chạy migrations:
 *   pnpm --filter @tuvi/db migrate
 *
 * Yêu cầu: DATABASE_URL trong root .env (load bằng tsx --env-file).
 * Cách 1: pnpm --filter @tuvi/db exec tsx --env-file=../../.env src/migrate.ts
 * Cách 2 (đã wire trong package.json): pnpm --filter @tuvi/db migrate
 *   (cần thêm flag --env-file ở scripts nếu chạy chuẩn)
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { resolve } from 'node:path';
import { sql } from 'drizzle-orm';
import { prices, subscriptionPlans } from './schema.js';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL chưa được set');

  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);

  console.log('[migrate] đang chạy migrations...');
  await migrate(db, { migrationsFolder: resolve(process.cwd(), 'migrations') });

  console.log('[migrate] seed prices (idempotent)...');
  // pgcrypto cần cho gen_random_uuid()
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  await db
    .insert(prices)
    .values([
      { action: 'analyze', amountVnd: 30000, description: 'Lập lá số + 6 phần luận' },
      { action: 'deep_readings', amountVnd: 20000, description: 'Đại hạn + 12 cung + năm hiện tại' },
      { action: 'combo', amountVnd: 40000, description: 'Combo cả 2 (giảm 20%)' },
    ])
    .onConflictDoNothing();

  console.log('[migrate] seed subscription_plans (idempotent)...');
  await db
    .insert(subscriptionPlans)
    .values([
      {
        plan: 'monthly',
        amountVnd: 20000,
        durationDays: 30,
        label: 'Gói Tháng',
        description: '30 ngày sử dụng không giới hạn',
        sortOrder: 1,
      },
      {
        plan: 'semi_annual',
        amountVnd: 50000,
        durationDays: 180,
        label: 'Gói Nửa Năm',
        description: '180 ngày — tiết kiệm 17% so với mua từng tháng',
        sortOrder: 2,
      },
      {
        plan: 'annual',
        amountVnd: 100000,
        durationDays: 365,
        label: 'Gói Năm',
        description: '365 ngày — tiết kiệm 58% so với mua từng tháng',
        sortOrder: 3,
      },
      {
        plan: 'lifetime',
        amountVnd: 500000,
        durationDays: null,
        label: 'Gói Trọn Đời',
        description: 'Truy cập vĩnh viễn — mua 1 lần dùng mãi mãi',
        sortOrder: 4,
      },
    ])
    .onConflictDoNothing();

  console.log('[migrate] xong');
  await client.end();
}

main().catch((e) => {
  console.error('[migrate] LỖI:', e);
  process.exit(1);
});
