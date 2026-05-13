-- Drop legacy columns:
--   users.balance_vnd — pure ledger không có code deduct, gây confusion.
--     Model wallet đã chuyển hoàn toàn sang subscription (proUntil).
--   charts.slug — global UNIQUE collision risk khi 2 user cùng (name, birthDate).
--     URL key đổi sang charts.id (UUID) — match pattern tu-tru, không collision.

ALTER TABLE "users" DROP COLUMN IF EXISTS "balance_vnd";
--> statement-breakpoint
ALTER TABLE "charts" DROP COLUMN IF EXISTS "slug";
