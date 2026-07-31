CREATE INDEX "diagnoses_org_idx" ON "diagnoses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "diagnoses_patient_idx" ON "diagnoses" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "diagnoses_created_by_idx" ON "diagnoses" USING btree ("created_by_member_id");--> statement-breakpoint
CREATE INDEX "prescriptions_org_idx" ON "prescriptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "prescriptions_diagnosis_idx" ON "prescriptions" USING btree ("diagnosis_id");--> statement-breakpoint
CREATE INDEX "prescriptions_prescribed_by_idx" ON "prescriptions" USING btree ("prescribed_by_member_id");--> statement-breakpoint
CREATE INDEX "questionnaire_responses_org_idx" ON "questionnaire_responses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "questionnaire_responses_patient_idx" ON "questionnaire_responses" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "visits_provider_idx" ON "visits" USING btree ("provider_member_id");