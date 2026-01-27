ALTER TABLE "sessions" ADD COLUMN "review_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "review_started_by" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "approved_by" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "merged_at" timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "merged_by" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_review_started_by_users_id_fk" FOREIGN KEY ("review_started_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_merged_by_users_id_fk" FOREIGN KEY ("merged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;