/**
 * Chạy migrations:
 *   pnpm --filter @tuvi/db migrate
 *
 * Yêu cầu: DATABASE_URL trong root .env (load bằng tsx --env-file).
 * Cách 1: pnpm --filter @tuvi/db exec tsx --env-file=../../.env src/migrate.ts
 * Cách 2 (đã wire trong package.json): pnpm --filter @tuvi/db migrate
 *   (cần thêm flag --env-file ở scripts nếu chạy chuẩn)
 */
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { resolve } from 'node:path';
import { sql } from 'drizzle-orm';
import ws from 'ws';
import { prices } from './schema.js';

// Migrate chạy Node.js (CI/local), luôn cần ws polyfill.
neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL chưa được set');

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  console.log('[migrate] đang chạy migrations...');
  await migrate(db, { migrationsFolder: resolve(process.cwd(), 'migrations') });

  // pgcrypto cần cho gen_random_uuid()
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  console.log('[migrate] seed prices (upsert)...');
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
  await pool.end();
}

main().catch((e) => {
  console.error('[migrate] LỖI:', e);
  process.exit(1);
});
