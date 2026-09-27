CREATE TABLE "ai_answer_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"answer_key" text NOT NULL,
	"correct" boolean NOT NULL,
	"comment" text,
	"corrected" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "translation" text;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "words" jsonb;--> statement-breakpoint
ALTER TABLE "ai_answer_checks" ADD CONSTRAINT "ai_answer_checks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_answer_checks_user_exercise_answer_idx" ON "ai_answer_checks" USING btree ("user_id","exercise_id","answer_key");