/**
 * Test publish 1 balance event giả tới channel của user. Chạy:
 *
 *   pnpm --filter @tuvi/web exec tsx --env-file=../../.env scripts/test-realtime.ts <userIdOrEmail>
 *
 * userIdOrEmail = UUID user (đọc từ DB) HOẶC email — script tự lookup.
 * Trong browser /vi-cua-toi đăng nhập tài khoản đó sẽ thấy:
 *  - Số dư nhảy lên giá trị giả
 *  - Toast "Admin tặng …" hiện ra
 *
 * Test xong, F5 → balance về số thật từ DB (event này không persist).
 */
import { getDb, users } from '@tuvi/db';
import { eq } from 'drizzle-orm';
import { publishWalletEvent } from '../src/lib/realtime-server';

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: tsx scripts/test-realtime.ts <userIdOrEmail>');
    process.exit(1);
  }

  const db = getDb();
  const [user] = arg.includes('@')
    ? await db.select({ id: users.id, email: users.email, balanceVnd: users.balanceVnd })
        .from(users).where(eq(users.email, arg)).limit(1)
    : await db.select({ id: users.id, email: users.email, balanceVnd: users.balanceVnd })
        .from(users).where(eq(users.id, arg)).limit(1);

  if (!user) {
    console.error(`User không tồn tại: ${arg}`);
    process.exit(1);
  }

  console.log(`Target user: ${user.email} (id=${user.id})`);
  console.log(`Balance hiện tại: ${user.balanceVnd}đ`);
  console.log(`Publishing fake balance event...`);

  await publishWalletEvent(user.id, {
    balanceVnd: 1_234_567,
    delta: 500_000,
    reason: 'admin_credit',
  });

  console.log(`Done. Mở browser tab /vi-cua-toi (đăng nhập ${user.email}) sẽ thấy:`);
  console.log(`  - Số dư header + page = 1.234.567đ`);
  console.log(`  - Toast "Admin tặng 500.000đ vào ví"`);
  console.log(`Refresh trang → balance về số thật từ DB.`);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
