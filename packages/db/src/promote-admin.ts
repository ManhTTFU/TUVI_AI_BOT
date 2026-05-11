/**
 * Promote 1 user thành admin. Chạy:
 *   pnpm --filter @tuvi/db exec tsx --env-file=../../.env src/promote-admin.ts <email>
 *
 * Dùng sau khi đăng nhập lần đầu (Google) để biến user đầu tiên thành admin.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { users } from './schema.js';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: tsx promote-admin.ts <email>');
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL chưa được set');

  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);

  const [updated] = await db
    .update(users)
    .set({ role: 'admin' })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email, role: users.role });

  if (!updated) {
    console.error(`Không tìm thấy user với email "${email}". User cần đăng nhập trước.`);
    process.exit(1);
  }

  console.log(`Đã promote ${updated.email} (${updated.id}) thành ${updated.role}`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
