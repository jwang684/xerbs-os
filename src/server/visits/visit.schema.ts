import { z } from "zod";

export const visitStatusValues = ["open", "completed", "cancelled"] as const;

// Accept case-insensitive status (spec presents them as Open/Completed/Cancelled);
// canonical storage/output is lowercase.
const statusSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.toLowerCase() : v),
  z.enum(visitStatusValues),
);

/** Fields accepted when creating a visit. Each visit belongs to one patient. */
export const createVisitSchema = z.object({
  patientId: z.uuid(),
  providerId: z.uuid().nullish(),
  status: statusSchema.optional(),
  chiefComplaint: z.string().trim().min(1).max(2000).nullish(),
  visitDate: z.coerce.date().optional(),
  notes: z.string().trim().min(1).max(10000).nullish(),
});

/** Updatable fields — patientId is immutable (a visit belongs to one patient). */
export const updateVisitSchema = z.object({
  providerId: z.uuid().nullish(),
  status: statusSchema.optional(),
  chiefComplaint: z.string().trim().min(1).max(2000).nullish(),
  visitDate: z.coerce.date().optional(),
  notes: z.string().trim().min(1).max(10000).nullish(),
});

/** Query params for list with filtering + pagination. */
export const listVisitsQuerySchema = z.object({
  patientId: z.uuid().optional(),
  status: statusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const visitIdSchema = z.uuid("Invalid visit id");

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
export type ListVisitsQuery = z.infer<typeof listVisitsQuerySchema>;
