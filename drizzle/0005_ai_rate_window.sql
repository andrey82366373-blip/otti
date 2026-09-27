ALTER TABLE "ai_usage" ADD COLUMN "window_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD COLUMN "window_requests" integer DEFAULT 0 NOT NULL;