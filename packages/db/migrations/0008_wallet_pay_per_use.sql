-- 2026-05-14: Chuyển từ model subscription PRO/NORMAL sang model wallet pay-per-use.
--   - Mỗi user có ví số dư VND (balance_vnd). Min topup 20k. Mỗi lần luận giải -5k.
--   - balance_vnd là cache denormalized của ledger transactions. Source of truth vẫn là
--     bảng transactions; cập nhật balance atomic trong cùng db.transaction(...) với
--     INSERT charge/topup row.
--
-- Backfill: balance_vnd = sum(amount_vnd) các tx completed. Subscription txs cũ
-- vẫn nằm trong ledger để audit nhưng KHÔNG cộng vào balance (subscription đã
-- "tiêu" sang proUntil rồi, không phải tiền user còn lại). Charges/refunds âm
-- chưa từng có trước đây nên về số học không ảnh hưởng.

ALTER TABLE "users" ADD COLUMN "balance_vnd" bigint NOT NULL DEFAULT 0;
--> statement-breakpoint

-- Backfill từ ledger: chỉ tính các tx topup/admin_credit/refund/charge đã completed.
UPDATE "users" u
SET "balance_vnd" = COALESCE((
  SELECT SUM(t."amount_vnd")
  FROM "transactions" t
  WHERE t."user_id" = u."id"
    AND t."status" = 'completed'
    AND t."type" IN ('topup', 'admin_credit', 'refund', 'charge')
), 0);
--> statement-breakpoint

-- Drop subscription artifacts. subscription_purchases có FK tới transactions
-- (ON DELETE SET NULL) nên drop table này trước an toàn.
DROP TABLE IF EXISTS "subscription_purchases";
--> statement-breakpoint
DROP TABLE IF EXISTS "subscription_plans";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "pro_until";
--> statement-breakpoint

-- Drop enum "plan" (chỉ subscription_plans + subscription_purchases dùng, đã drop).
DROP TYPE IF EXISTS "public"."plan";
--> statement-breakpoint

-- Note: enum values 'subscription' và 'admin_extend' trong tx_type được GIỮ LẠI
-- vì Postgres không hỗ trợ drop enum value khi đã có row dùng (tx history). Code
-- không tạo tx loại đó nữa, chỉ là tag historical.
