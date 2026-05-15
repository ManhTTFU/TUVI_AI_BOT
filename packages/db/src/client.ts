import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from './schema.js';

// Node.js < 22 không có WebSocket global. CF Workers/Edge runtime đã có sẵn.
// Polyfill bằng `ws` package qua dynamic import — CF bundler tree-shake khi
// build cho edge runtime (vì branch không đạt được).
if (typeof globalThis.WebSocket === 'undefined') {
  const { default: ws } = await import('ws');
  neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _pool: Pool | null = null;

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL chưa được cấu hình. Đăng ký Neon (https://neon.tech) miễn phí, lấy connection string, thêm vào .env: DATABASE_URL=postgres://...',
    );
  }
  return url;
}

export function getDb() {
  if (_db) return _db;
  _pool = new Pool({ connectionString: getConnectionString() });
  _db = drizzle(_pool, { schema });
  return _db;
}

export async function closeDb(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
  }
}

export type DB = ReturnType<typeof getDb>;
