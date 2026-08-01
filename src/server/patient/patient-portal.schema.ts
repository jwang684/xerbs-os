import { z } from "zod";

/** A patient-editable postal address. All parts optional. */
export const addressSchema = z
  .object({
    line1: z.string().trim().max(200).optional(),
    line2: z.string().trim().max(200).optional(),
    city: z.string().trim().max(120).optional(),
    state: z.string().trim().max(120).optional(),
    postalCode: z.string().trim().max(40).optional(),
    country: z.string().trim().max(120).optional(),
  })
  .strict();

/**
 * Fields a patient may change about themselves: contact info and address only.
 * No medical or identity editing (name, DOB, sex are managed by the clinic).
 * `null` clears a field; an omitted field is left unchanged.
 */
export const updateProfileSchema = z
  .object({
    email: z.email().max(320).nullish(),
    phone: z.string().trim().min(1).max(50).nullish(),
    address: addressSchema.nullish(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const visitIdSchema = z.uuid("Invalid visit id");
