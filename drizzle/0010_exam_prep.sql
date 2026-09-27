CREATE TABLE "exam_ai_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"task_id" text NOT NULL,
	"content_hash" text NOT NULL,
	"status" text NOT NULL,
	"day" date NOT NULL,
	"writing" jsonb,
	"speaking" jsonb,
	"content" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"exam" text DEFAULT 'ielts' NOT NULL,
	"skill" text NOT NULL,
	"task_id" text NOT NULL,
	"mode" text NOT NULL,
	"correct" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"band_low" real,
	"band_high" real,
	"answers" jsonb,
	"review" jsonb,
	"duration_sec" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_drafts" (
	"user_id" text NOT NULL,
	"task_id" text NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exam_drafts_user_id_task_id_pk" PRIMARY KEY("user_id","task_id")
);
--> statement-breakpoint
CREATE TABLE "exam_profiles" (
	"user_id" text NOT NULL,
	"exam" text DEFAULT 'ielts' NOT NULL,
	"module" text NOT NULL,
	"target_band" real NOT NULL,
	"exam_date" date,
	"current_level" text NOT NULL,
	"sessions_per_week" integer NOT NULL,
	"weakest_skill" text NOT NULL,
	"plan" jsonb,
	"diagnostic" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exam_profiles_user_id_exam_pk" PRIMARY KEY("user_id","exam")
);
--> statement-breakpoint
ALTER TABLE "exam_ai_checks" ADD CONSTRAINT "exam_ai_checks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_drafts" ADD CONSTRAINT "exam_drafts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_profiles" ADD CONSTRAINT "exam_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exam_ai_checks_unique_idx" ON "exam_ai_checks" USING btree ("user_id","kind","task_id","content_hash");--> statement-breakpoint
CREATE INDEX "exam_ai_checks_user_day_idx" ON "exam_ai_checks" USING btree ("user_id","kind","day");--> statement-breakpoint
CREATE INDEX "exam_attempts_user_skill_idx" ON "exam_attempts" USING btree ("user_id","skill","created_at");