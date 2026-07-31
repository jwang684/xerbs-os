import type { ZodType } from "zod";

import type { Patient } from "@/db/schema";

import { assertCanWrite, type AuthContext } from "../auth/authz";
import { NotFoundError, ValidationError } from "../http/errors";
import {
  patientRepository,
  type ListPatientsResult,
} from "./patient.repository";
import {
  createPatientSchema,
  listPatientsQuerySchema,
  patientIdSchema,
  updatePatientSchema,
} from "./patient.schema";

function validate<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Validation failed", result.error.issues);
  }
  return result.data;
}

/**
 * Patient business logic. Enforces authorization (write roles) and input
 * validation, delegates tenant-scoped persistence to the repository, and turns
 * "not found" into a domain error. Every method takes the caller's AuthContext
 * so organization scoping is never optional.
 */
export const patientService = {
  async create(ctx: AuthContext, input: unknown): Promise<Patient> {
    assertCanWrite(ctx);
    const data = validate(createPatientSchema, input);
    return patientRepository.create(ctx.organizationId, data);
  },

  async get(ctx: AuthContext, id: string): Promise<Patient> {
    const patientId = validate(patientIdSchema, id);
    const patient = await patientRepository.findById(ctx.organizationId, patientId);
    if (!patient) {
      throw new NotFoundError("Patient not found");
    }
    return patient;
  },

  async update(ctx: AuthContext, id: string, input: unknown): Promise<Patient> {
    assertCanWrite(ctx);
    const patientId = validate(patientIdSchema, id);
    const data = validate(updatePatientSchema, input);

    // Nothing to change — return the current record (also yields 404 if gone).
    if (Object.keys(data).length === 0) {
      return this.get(ctx, patientId);
    }

    const patient = await patientRepository.update(
      ctx.organizationId,
      patientId,
      data,
    );
    if (!patient) {
      throw new NotFoundError("Patient not found");
    }
    return patient;
  },

  async remove(ctx: AuthContext, id: string): Promise<Patient> {
    assertCanWrite(ctx);
    const patientId = validate(patientIdSchema, id);
    const patient = await patientRepository.softDelete(
      ctx.organizationId,
      patientId,
    );
    if (!patient) {
      throw new NotFoundError("Patient not found");
    }
    return patient;
  },

  async list(ctx: AuthContext, query: unknown): Promise<ListPatientsResult> {
    const { q, limit, offset } = validate(listPatientsQuerySchema, query);
    return patientRepository.list(ctx.organizationId, { q, limit, offset });
  },
};
