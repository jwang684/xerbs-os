ALTER TABLE "diagnoses" ADD COLUMN "is_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "provider" text NOT NULL;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "model" text NOT NULL;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "prompt_version" text NOT NULL;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "structured_result" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "raw_response" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "disclaimer" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "diagnoses_active_per_visit_uq" ON "diagnoses" USING btree ("visit_id") WHERE "diagnoses"."is_active";