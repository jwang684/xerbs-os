CREATE TABLE "provider_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text,
	"specialty" text,
	"license_number" text,
	"npi" text,
	"avatar_url" text,
	"signature_url" text,
	"bio" text,
	"working_hours" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "provider_profiles_org_user_uq" ON "provider_profiles" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "provider_profiles_org_idx" ON "provider_profiles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "provider_profiles_user_idx" ON "provider_profiles" USING btree ("user_id");