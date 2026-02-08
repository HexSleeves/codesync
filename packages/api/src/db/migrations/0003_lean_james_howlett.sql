CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "comments_session_id_idx" ON "comments" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "comments_file_id_idx" ON "comments" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "comments_thread_id_idx" ON "comments" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "files_session_id_idx" ON "files" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_participants_user_id_idx" ON "session_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_created_by_idx" ON "sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "sessions_status_idx" ON "sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_share_token_idx" ON "sessions" USING btree ("share_token");--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_unique" UNIQUE("session_id","user_id");