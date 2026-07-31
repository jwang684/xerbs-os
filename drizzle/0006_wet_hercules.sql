ALTER TABLE "diagnoses" DROP CONSTRAINT "diagnoses_created_by_member_id_organization_members_id_fk";
--> statement-breakpoint
DROP INDEX "diagnoses_created_by_idx";--> statement-breakpoint
ALTER TABLE "diagnoses" DROP COLUMN "pattern";--> statement-breakpoint
ALTER TABLE "diagnoses" DROP COLUMN "rationale";--> statement-breakpoint
ALTER TABLE "diagnoses" DROP COLUMN "source";--> statement-breakpoint
ALTER TABLE "diagnoses" DROP COLUMN "is_primary";--> statement-breakpoint
ALTER TABLE "diagnoses" DROP COLUMN "created_by_member_id";--> statement-breakpoint
ALTER TABLE "diagnoses" DROP COLUMN "updated_at";--> statement-breakpoint
DROP TYPE "public"."diagnosis_source";