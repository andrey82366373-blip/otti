ALTER TABLE "chat_messages" ADD COLUMN "client_request_id" text;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "action" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "chat_messages_thread_request_idx" ON "chat_messages" USING btree ("thread_id","role","client_request_id");