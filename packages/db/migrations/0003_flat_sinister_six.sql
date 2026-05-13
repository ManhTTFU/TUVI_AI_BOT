CREATE TABLE IF NOT EXISTS "daily_horoscope" (
	"date" varchar(10) PRIMARY KEY NOT NULL,
	"readings" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
