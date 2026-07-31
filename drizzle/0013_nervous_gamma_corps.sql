CREATE TABLE "soap_note_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"soap_note_id" uuid NOT NULL,
	"visit_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"subjective" text DEFAULT '' NOT NULL,
	"objective" text DEFAULT '' NOT NULL,
	"assessment" text DEFAULT '' NOT NULL,
	"plan" text DEFAULT '' NOT NULL,
	"author_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soap_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"visit_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"subjective" text DEFAULT '' NOT NULL,
	"objective" text DEFAULT '' NOT NULL,
	"assessment" text DEFAULT '' NOT NULL,
	"plan" text DEFAULT '' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "soap_note_revisions" ADD CONSTRAINT "soap_note_revisions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soap_note_revisions" ADD CONSTRAINT "soap_note_revisions_soap_note_id_soap_notes_id_fk" FOREIGN KEY ("soap_note_id") REFERENCES "public"."soap_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soap_note_revisions" ADD CONSTRAINT "soap_note_revisions_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soap_note_revisions" ADD CONSTRAINT "soap_note_revisions_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soap_notes" ADD CONSTRAINT "soap_notes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soap_notes" ADD CONSTRAINT "soap_notes_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soap_notes" ADD CONSTRAINT "soap_notes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "soap_note_revisions_note_version_uq" ON "soap_note_revisions" USING btree ("soap_note_id","version");--> statement-breakpoint
CREATE INDEX "soap_note_revisions_note_idx" ON "soap_note_revisions" USING btree ("soap_note_id");--> statement-breakpoint
CREATE INDEX "soap_note_revisions_visit_idx" ON "soap_note_revisions" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX "soap_note_revisions_org_idx" ON "soap_note_revisions" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "soap_notes_visit_uq" ON "soap_notes" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX "soap_notes_org_idx" ON "soap_notes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "soap_notes_patient_idx" ON "soap_notes" USING btree ("patient_id");