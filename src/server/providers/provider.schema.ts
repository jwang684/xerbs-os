import { z } from "zod";

const timeRange = z
  .object({
    start: z.string().regex(/^\d{2}:\d{2}$/, "Expected HH:MM"),
    end: z.string().regex(/^\d{2}:\d{2}$/, "Expected HH:MM"),
  })
  .strict();

// Weekly availability keyed by day (e.g. "monday"), each an array of ranges.
const workingHoursSchema = z.record(z.string(), z.array(timeRange));

// Fields a provider profile can carry (excluding identity/tenant + audit).
const providerFields = {
  title: z.string().trim().max(100).nullish(),
  specialty: z.string().trim().max(100).nullish(),
  licenseNumber: z.string().trim().max(100).nullish(),
  npi: z.string().regex(/^\d{10}$/, "NPI must be 10 digits").nullish(),
  avatarUrl: z.url().max(2048).nullish(),
  signatureUrl: z.url().max(2048).nullish(),
  bio: z.string().max(5000).nullish(),
  workingHours: workingHoursSchema.nullish(),
  isActive: z.boolean().optional(),
};

/** Create: identifies the member (userId); organization comes from the session. */
export const createProviderSchema = z.object({
  userId: z.string().min(1),
  ...providerFields,
});

/** Update: identity + tenant are immutable, so only the profile fields. */
export const updateProviderSchema = z.object(providerFields);

export const listProvidersQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const providerIdParamSchema = z.uuid("Invalid provider id");

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type ListProvidersQuery = z.infer<typeof listProvidersQuerySchema>;
