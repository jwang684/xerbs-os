ALTER TABLE "prescriptions" DROP CONSTRAINT "prescriptions_prescribed_by_member_id_organization_members_id_fk";
--> statement-breakpoint
ALTER TABLE "prescriptions" DROP CONSTRAINT "prescriptions_diagnosis_id_diagnoses_id_fk";
--> statement-breakpoint
DROP INDEX "prescriptions_prescribed_by_idx";--> statement-breakpoint
ALTER TABLE "prescriptions" ALTER COLUMN "diagnosis_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_diagnosis_id_diagnoses_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."diagnoses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" DROP COLUMN "prescribed_by_member_id";--> statement-breakpoint
ALTER TABLE "prescriptions" DROP COLUMN "formula_name";--> statement-breakpoint
ALTER TABLE "prescriptions" DROP COLUMN "therapeutic_principle";--> statement-breakpoint
ALTER TABLE "prescriptions" DROP COLUMN "items";--> statement-breakpoint
ALTER TABLE "prescriptions" DROP COLUMN "dosage_instructions";--> statement-breakpoint
ALTER TABLE "prescriptions" DROP COLUMN "duration_days";--> statement-breakpoint
ALTER TABLE "prescriptions" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "prescriptions" DROP COLUMN "updated_at";--> statement-breakpoint
DROP TYPE "public"."prescription_status";