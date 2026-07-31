-- Reshape visits to the Phase 5 Visit domain.
-- Hand-written: the changes below are renames + an enum-value rename, which
-- drizzle-kit can only resolve via interactive prompts (no TTY available here).
ALTER TABLE "visits" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TYPE "public"."visit_status" RENAME VALUE 'in_progress' TO 'open';--> statement-breakpoint
ALTER TABLE "visits" ALTER COLUMN "status" SET DEFAULT 'open';--> statement-breakpoint
ALTER TABLE "visits" RENAME COLUMN "provider_member_id" TO "provider_id";--> statement-breakpoint
ALTER TABLE "visits" RENAME CONSTRAINT "visits_provider_member_id_organization_members_id_fk" TO "visits_provider_id_organization_members_id_fk";--> statement-breakpoint
ALTER TABLE "visits" RENAME COLUMN "started_at" TO "visit_date";--> statement-breakpoint
ALTER TABLE "visits" DROP COLUMN "completed_at";--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "notes" text;
