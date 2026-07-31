import { z } from "zod";

/** Fields accepted when creating a patient. */
export const createPatientSchema = z.object({
  fullName: z.string().trim().min(1, "fullName is required").max(200),
  dateOfBirth: z.iso.date().nullish(),
  sex: z.enum(["male", "female", "other", "unknown"]).optional(),
  email: z.email().max(320).nullish(),
  phone: z.string().trim().min(1).max(50).nullish(),
});

/** All fields optional when updating; at least the shape is validated. */
export const updatePatientSchema = createPatientSchema.partial();

/** Query params for list/search with pagination. */
export const listPatientsQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const patientIdSchema = z.uuid("Invalid patient id");

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>;
