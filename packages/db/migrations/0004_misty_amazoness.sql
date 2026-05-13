CREATE TABLE IF NOT EXISTS "hoang_dao_charts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"sign_en" varchar(16) NOT NULL,
	"gender" varchar(8) NOT NULL,
	"status" varchar(12) NOT NULL,
	"goal" varchar(12) NOT NULL,
	"reading" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hoang_dao_charts" ADD CONSTRAINT "hoang_dao_charts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hoang_dao_charts_user_idx" ON "hoang_dao_charts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "hoang_dao_charts_user_combo_uniq" ON "hoang_dao_charts" USING btree ("user_id","sign_en","gender","status","goal");