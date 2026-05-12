CREATE TABLE IF NOT EXISTS "bat_tu_analyses" (
	"birth_hash" varchar(32) PRIMARY KEY NOT NULL,
	"markdown" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bat_tu_charts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"gender" varchar(8) NOT NULL,
	"solar_date" varchar(10) NOT NULL,
	"hour" integer NOT NULL,
	"minute" integer NOT NULL,
	"birth_place" text,
	"birth_hash" varchar(32) NOT NULL,
	"chart_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bat_tu_charts" ADD CONSTRAINT "bat_tu_charts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bat_tu_charts_user_idx" ON "bat_tu_charts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bat_tu_charts_hash_idx" ON "bat_tu_charts" USING btree ("birth_hash");