CREATE TYPE "public"."diagnosis_source" AS ENUM('ai', 'clinician');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'practitioner', 'staff');--> statement-breakpoint
CREATE TYPE "public"."patient_sex" AS ENUM('male', 'female', 'other', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."prescription_status" AS ENUM('draft', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."visit_status" AS ENUM('in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "diagnoses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"visit_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"pattern" text NOT NULL,
	"rationale" text,
	"confidence" real,
	"source" "diagnosis_source" DEFAULT 'clinician' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_by_member_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" DEFAULT 'practitioner' NOT NULL,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" date,
	"sex" "patient_sex" DEFAULT 'unknown' NOT NULL,
	"email" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"visit_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"diagnosis_id" uuid,
	"prescribed_by_member_id" uuid,
	"formula_name" text NOT NULL,
	"therapeutic_principle" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dosage_instructions" text,
	"duration_days" integer,
	"status" "prescription_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questionnaire_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"visit_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"provider_member_id" uuid,
	"status" "visit_status" DEFAULT 'in_progress' NOT NULL,
	"chief_complaint" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_created_by_member_id_organization_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."organization_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_diagnosis_id_diagnoses_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."diagnoses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_prescribed_by_member_id_organization_members_id_fk" FOREIGN KEY ("prescribed_by_member_id") REFERENCES "public"."organization_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_provider_member_id_organization_members_id_fk" FOREIGN KEY ("provider_member_id") REFERENCES "public"."organization_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diagnoses_visit_idx" ON "diagnoses" USING btree ("visit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_members_org_user_uq" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_members_user_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "patients_org_idx" ON "patients" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "prescriptions_visit_idx" ON "prescriptions" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX "prescriptions_patient_idx" ON "prescriptions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "questionnaire_responses_visit_idx" ON "questionnaire_responses" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX "visits_org_idx" ON "visits" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "visits_patient_idx" ON "visits" USING btree ("patient_id");