CREATE TABLE IF NOT EXISTS "tarot_charts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"gender" varchar(8) NOT NULL,
	"field" varchar(16) NOT NULL,
	"question" text,
	"num_cards" integer NOT NULL,
	"cards" jsonb NOT NULL,
	"reading_hash" varchar(32) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tarot_readings" (
	"reading_hash" varchar(32) PRIMARY KEY NOT NULL,
	"cards_json" jsonb NOT NULL,
	"field" varchar(16) NOT NULL,
	"per_card" jsonb NOT NULL,
	"overall_markdown" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tarot_charts" ADD CONSTRAINT "tarot_charts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tarot_charts_user_created_idx" ON "tarot_charts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tarot_charts_hash_idx" ON "tarot_charts" USING btree ("reading_hash");