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

// Không dùng singleton Pool — CF Workers chạy nhiều request cùng isolate, WebSocket
// (I/O type: Native) không thể share giữa các request context khác nhau. Tạo Pool
// mới mỗi call — Neon serverless Pool là lazy (WebSocket mở khi query đầu tiên),
// constructor rẻ, phù hợp serverless request-per-connection model.
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
  const pool = new Pool({ connectionString: getConnectionString() });
  return drizzle(pool, { schema });
}

export async function closeDb(): Promise<void> {
  // No-op trong serverless model — Pool garbage collected sau mỗi request.
}

export type DB = ReturnType<typeof getDb>;
