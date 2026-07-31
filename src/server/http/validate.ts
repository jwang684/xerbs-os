import type { ZodType } from "zod";

import { ValidationError } from "./errors";

/** Validates `data` against `schema`, throwing ValidationError (422) on failure. */
export function validate<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Validation failed", result.error.issues);
  }
  return result.data;
}
