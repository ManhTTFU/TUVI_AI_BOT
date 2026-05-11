import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

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
  _sql = postgres(getConnectionString(), {
    max: Number(process.env.DB_POOL_MAX) || 10,
    idle_timeout: 30,
    prepare: false, // Neon serverless tốt hơn khi tắt prepared statements
  });
  _db = drizzle(_sql, { schema });
  return _db;
}

export async function closeDb(): Promise<void> {
  if (_sql) {
    await _sql.end();
    _sql = null;
    _db = null;
  }
}

export type DB = ReturnType<typeof getDb>;
