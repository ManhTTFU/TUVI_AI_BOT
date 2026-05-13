-- Refactor hoang_dao_charts → 2-bảng pattern theo chuẩn Tử Vi/Tứ Trụ:
--   hoang_dao_charts (submission per-user, không chứa reading)
--   hoang_dao_analyses (PK birth_hash, share cross-user)
-- Hash: sha256(signEn|gender|status|goal).slice(0,16) — pgcrypto digest().

-- 1. Bảng analyses mới
CREATE TABLE IF NOT EXISTS "hoang_dao_analyses" (
	"birth_hash" varchar(32) PRIMARY KEY NOT NULL,
	"reading" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- 2. Thêm cột birth_hash (nullable tạm để backfill)
ALTER TABLE "hoang_dao_charts" ADD COLUMN IF NOT EXISTS "birth_hash" varchar(32);
--> statement-breakpoint

-- 3. Backfill birth_hash từ 4 input columns (giống logic SHA256 trong code).
--    pgcrypto digest() → hex → cắt 16 ký tự đầu.
UPDATE "hoang_dao_charts"
SET "birth_hash" = SUBSTRING(
  ENCODE(
    DIGEST(
      "sign_en" || '|' || "gender" || '|' || "status" || '|' || "goal",
      'sha256'
    ),
    'hex'
  ),
  1, 16
)
WHERE "birth_hash" IS NULL;
--> statement-breakpoint

-- 4. Move reading từ charts → analyses (dedup theo hash, hash đầu tiên gặp thắng).
INSERT INTO "hoang_dao_analyses" ("birth_hash", "reading", "created_at")
SELECT DISTINCT ON ("birth_hash") "birth_hash", "reading", "created_at"
FROM "hoang_dao_charts"
WHERE "birth_hash" IS NOT NULL
ORDER BY "birth_hash", "created_at" ASC
ON CONFLICT ("birth_hash") DO NOTHING;
--> statement-breakpoint

-- 5. Set NOT NULL + drop reading column
ALTER TABLE "hoang_dao_charts" ALTER COLUMN "birth_hash" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "hoang_dao_charts" DROP COLUMN IF EXISTS "reading";
--> statement-breakpoint

-- 6. Drop old indexes
DROP INDEX IF EXISTS "hoang_dao_charts_user_combo_uniq";
--> statement-breakpoint
DROP INDEX IF EXISTS "hoang_dao_charts_user_idx";
--> statement-breakpoint

-- 7. Create new indexes
CREATE INDEX IF NOT EXISTS "hoang_dao_charts_user_created_idx"
  ON "hoang_dao_charts" USING btree ("user_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hoang_dao_charts_hash_idx"
  ON "hoang_dao_charts" USING btree ("birth_hash");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "hoang_dao_charts_user_hash_uniq"
  ON "hoang_dao_charts" USING btree ("user_id", "birth_hash");
--> statement-breakpoint

-- 8. Composite (user_id, created_at) cho charts + bat_tu_charts (history listing).
--    Drop user-only index cũ, replace bằng composite (PG dùng composite cho cả 2 case).
DROP INDEX IF EXISTS "charts_user_idx";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "charts_user_created_idx"
  ON "charts" USING btree ("user_id", "created_at");
--> statement-breakpoint
DROP INDEX IF EXISTS "bat_tu_charts_user_idx";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bat_tu_charts_user_created_idx"
  ON "bat_tu_charts" USING btree ("user_id", "created_at");
