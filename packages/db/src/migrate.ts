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
import { prices } from './schema.js';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL chưa được set');

  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);

  console.log('[migrate] đang chạy migrations...');
  await migrate(db, { migrationsFolder: resolve(process.cwd(), 'migrations') });

  // pgcrypto cần cho gen_random_uuid()
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  console.log('[migrate] seed prices (upsert)...');
  // Model pay-per-use: 1 lần luận giải = 5000 VND. Dùng action='analyze' (đã có
  // trong enum chart_action). 'deep_readings' và 'combo' từ model cũ — DELETE
  // để chỉ còn 1 row giá. Dùng UPSERT (KHÔNG `onConflictDoNothing`) để khi đổi
  // giá ở source code + redeploy, bảng tự cập nhật theo.
  await db.execute(sql`DELETE FROM prices WHERE action IN ('deep_readings', 'combo')`);
  await db
    .insert(prices)
    .values([
      { action: 'analyze', amountVnd: 5000, description: 'Một lần luận giải (Tử Vi / Tứ Trụ / Tarot / Hoàng Đạo)' },
    ])
    .onConflictDoUpdate({
      target: prices.action,
      set: { amountVnd: 5000, description: 'Một lần luận giải (Tử Vi / Tứ Trụ / Tarot / Hoàng Đạo)' },
    });

  console.log('[migrate] xong');
  await client.end();
}

main().catch((e) => {
  console.error('[migrate] LỖI:', e);
  process.exit(1);
});
