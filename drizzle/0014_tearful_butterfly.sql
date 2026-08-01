ALTER TABLE "patients" ADD COLUMN "address" jsonb;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patients_user_idx" ON "patients" USING btree ("user_id");