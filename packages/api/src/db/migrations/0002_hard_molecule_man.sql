ALTER TABLE "comments" ADD COLUMN "github_comment_id" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "github_review_id" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "github_synced_at" timestamp;