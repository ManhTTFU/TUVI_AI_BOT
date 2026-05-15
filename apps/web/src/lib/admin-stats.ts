/**
 * Aggregation queries cho trang admin. Tất cả mốc thời gian quy đổi sang VN
 * (UTC+7) — Postgres lưu UTC nên phải `AT TIME ZONE 'Asia/Ho_Chi_Minh'` trước
 * khi `date_trunc` để ngày/tháng khớp với cảm nhận user VN (không lệch 7 giờ).
 *
 * Chỉ tính `type='topup' status='completed'` là DOANH THU (tiền thực nạp).
 * `admin_credit` không tính vì admin tặng free → không phải tiền vào.
 * `charge` là tiền user tiêu, tính riêng nếu cần metric khác.
 */
import { getDb } from '@tuvi/db';
import { sql } from 'drizzle-orm';

export interface DayBucket {
  day: string; // YYYY-MM-DD (VN time)
  totalVnd: number;
  count: number;
}

export interface MonthBucket {
  month: string; // YYYY-MM
  totalVnd: number;
  count: number;
}

export interface UserDayBucket {
  day: string;
  count: number;
}

export interface AdminStats {
  todayRevenueVnd: number;
  todayTopupCount: number;
  monthRevenueVnd: number;
  monthTopupCount: number;
  totalRevenueVnd: number;
  totalTopupCount: number;

  todayChargeCount: number;
  monthChargeCount: number;
  totalChargeCount: number;

  usersTotal: number;
  usersToday: number;
  usersMonth: number;

  daily: DayBucket[]; // 30 ngày gần nhất, đảo asc theo ngày
  monthly: MonthBucket[]; // 12 tháng gần nhất, asc
  usersDaily: UserDayBucket[]; // 30 ngày gần nhất
}

export async function getAdminStats(): Promise<AdminStats> {
  const db = getDb();

  // Doanh thu hôm nay / tháng này / tổng (chỉ topup completed)
  const topupTotals = await db.execute<{
    today: string;
    today_count: string;
    month: string;
    month_count: string;
    total: string;
    total_count: string;
  }>(sql`
    SELECT
      COALESCE(SUM(CASE WHEN (completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date THEN amount_vnd ELSE 0 END), 0) AS today,
      COUNT(*) FILTER (WHERE (completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) AS today_count,
      COALESCE(SUM(CASE WHEN date_trunc('month', completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') THEN amount_vnd ELSE 0 END), 0) AS month,
      COUNT(*) FILTER (WHERE date_trunc('month', completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')) AS month_count,
      COALESCE(SUM(amount_vnd), 0) AS total,
      COUNT(*) AS total_count
    FROM transactions
    WHERE type = 'topup' AND status = 'completed'
  `);
  const t = topupTotals.rows[0] ?? { today: '0', today_count: '0', month: '0', month_count: '0', total: '0', total_count: '0' };

  // Số lượt charge (luận giải) hôm nay / tháng / tổng
  const chargeCounts = await db.execute<{ today: string; month: string; total: string }>(sql`
    SELECT
      COUNT(*) FILTER (WHERE (completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) AS today,
      COUNT(*) FILTER (WHERE date_trunc('month', completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')) AS month,
      COUNT(*) AS total
    FROM transactions
    WHERE type = 'charge' AND status = 'completed'
  `);
  const c = chargeCounts.rows[0] ?? { today: '0', month: '0', total: '0' };

  // User counts
  const userCounts = await db.execute<{ total: string; today: string; month: string }>(sql`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) AS today,
      COUNT(*) FILTER (WHERE date_trunc('month', created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')) AS month
    FROM users
  `);
  const u = userCounts.rows[0] ?? { total: '0', today: '0', month: '0' };

  // Daily revenue 30 ngày gần nhất
  const dailyRows = await db.execute<{ day: string; total: string; count: string }>(sql`
    SELECT
      to_char(date_trunc('day', completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD') AS day,
      SUM(amount_vnd) AS total,
      COUNT(*) AS count
    FROM transactions
    WHERE type = 'topup' AND status = 'completed'
      AND completed_at >= now() - interval '30 days'
    GROUP BY day
    ORDER BY day ASC
  `);

  // Monthly revenue 12 tháng
  const monthlyRows = await db.execute<{ month: string; total: string; count: string }>(sql`
    SELECT
      to_char(date_trunc('month', completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM') AS month,
      SUM(amount_vnd) AS total,
      COUNT(*) AS count
    FROM transactions
    WHERE type = 'topup' AND status = 'completed'
      AND completed_at >= now() - interval '12 months'
    GROUP BY month
    ORDER BY month ASC
  `);

  // Users daily 30 ngày
  const userDailyRows = await db.execute<{ day: string; count: string }>(sql`
    SELECT
      to_char(date_trunc('day', created_at AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD') AS day,
      COUNT(*) AS count
    FROM users
    WHERE created_at >= now() - interval '30 days'
    GROUP BY day
    ORDER BY day ASC
  `);

  return {
    todayRevenueVnd: Number(t.today),
    todayTopupCount: Number(t.today_count),
    monthRevenueVnd: Number(t.month),
    monthTopupCount: Number(t.month_count),
    totalRevenueVnd: Number(t.total),
    totalTopupCount: Number(t.total_count),

    todayChargeCount: Number(c.today),
    monthChargeCount: Number(c.month),
    totalChargeCount: Number(c.total),

    usersTotal: Number(u.total),
    usersToday: Number(u.today),
    usersMonth: Number(u.month),

    daily: dailyRows.rows.map((r) => ({ day: r.day, totalVnd: Number(r.total), count: Number(r.count) })),
    monthly: monthlyRows.rows.map((r) => ({ month: r.month, totalVnd: Number(r.total), count: Number(r.count) })),
    usersDaily: userDailyRows.rows.map((r) => ({ day: r.day, count: Number(r.count) })),
  };
}
