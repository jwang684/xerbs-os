ALTER TABLE "diagnoses" ADD COLUMN "questionnaire_id" uuid;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD COLUMN "provider" text NOT NULL;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD COLUMN "model" text NOT NULL;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD COLUMN "prompt_version" text NOT NULL;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD COLUMN "reasoning" text;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD COLUMN "structured_result" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD COLUMN "raw_response" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD COLUMN "disclaimer" text NOT NULL;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_questionnaire_id_questionnaire_responses_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaire_responses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diagnoses_questionnaire_idx" ON "diagnoses" USING btree ("questionnaire_id");