CREATE TYPE "public"."plan" AS ENUM('monthly', 'semi_annual', 'annual', 'lifetime');--> statement-breakpoint
ALTER TYPE "public"."tx_type" ADD VALUE 'subscription';--> statement-breakpoint
ALTER TYPE "public"."tx_type" ADD VALUE 'admin_extend';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_plans" (
	"plan" "plan" PRIMARY KEY NOT NULL,
	"amount_vnd" bigint NOT NULL,
	"duration_days" integer,
	"label" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_purchases" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan" "plan" NOT NULL,
	"amount_vnd" bigint NOT NULL,
	"transaction_id" text,
	"pro_until_after" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pro_until" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_purchases" ADD CONSTRAINT "subscription_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_purchases" ADD CONSTRAINT "subscription_purchases_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_purchase_user_idx" ON "subscription_purchases" USING btree ("user_id");