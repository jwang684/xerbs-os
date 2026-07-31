ALTER TABLE "visits" ADD COLUMN "appointment_id" uuid;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "visits_appointment_id_uq" ON "visits" USING btree ("appointment_id");