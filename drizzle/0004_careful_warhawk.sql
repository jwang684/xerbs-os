DROP INDEX "questionnaire_responses_visit_idx";--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD COLUMN "schema_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "questionnaire_responses_visit_idx" ON "questionnaire_responses" USING btree ("visit_id");