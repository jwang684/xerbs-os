import type { Visit } from "@/db/schema";

import { assertCanWrite, type AuthContext } from "../auth/authz";
import { NotFoundError } from "../http/errors";
import { validate } from "../http/validate";
import { patientRepository } from "../patients/patient.repository";
import {
  visitRepository,
  type ListVisitsResult,
} from "./visit.repository";
import {
  createVisitSchema,
  listVisitsQuerySchema,
  updateVisitSchema,
  visitIdSchema,
} from "./visit.schema";

/**
 * Visit business logic. Enforces authorization and validation, guarantees
 * cross-entity tenant integrity (a visit's patient and provider must belong to
 * the caller's organization), and delegates tenant-scoped persistence to the
 * repository. No delete in this phase.
 */
export const visitService = {
  async create(ctx: AuthContext, input: unknown): Promise<Visit> {
    assertCanWrite(ctx);
    const data = validate(createVisitSchema, input);

    // The patient must exist (and be active) within the caller's organization.
    const patient = await patientRepository.findById(
      ctx.organizationId,
      data.patientId,
    );
    if (!patient) {
      throw new NotFoundError("Patient not found in organization");
    }

    // If a provider is assigned, it must be a member of the same organization.
    if (data.providerId) {
      const ok = await visitRepository.providerExists(
        ctx.organizationId,
        data.providerId,
      );
      if (!ok) {
        throw new NotFoundError("Provider not found in organization");
      }
    }

    return visitRepository.create(ctx.organizationId, data);
  },

  async get(ctx: AuthContext, id: string): Promise<Visit> {
    const visitId = validate(visitIdSchema, id);
    const visit = await visitRepository.findById(ctx.organizationId, visitId);
    if (!visit) {
      throw new NotFoundError("Visit not found");
    }
    return visit;
  },

  async update(ctx: AuthContext, id: string, input: unknown): Promise<Visit> {
    assertCanWrite(ctx);
    const visitId = validate(visitIdSchema, id);
    const data = validate(updateVisitSchema, input);

    if (Object.keys(data).length === 0) {
      return this.get(ctx, visitId);
    }

    // Re-assigning a provider must stay within the organization.
    if (data.providerId) {
      const ok = await visitRepository.providerExists(
        ctx.organizationId,
        data.providerId,
      );
      if (!ok) {
        throw new NotFoundError("Provider not found in organization");
      }
    }

    const visit = await visitRepository.update(
      ctx.organizationId,
      visitId,
      data,
    );
    if (!visit) {
      throw new NotFoundError("Visit not found");
    }
    return visit;
  },

  async list(ctx: AuthContext, query: unknown): Promise<ListVisitsResult> {
    const { patientId, status, limit, offset } = validate(
      listVisitsQuerySchema,
      query,
    );
    return visitRepository.list(ctx.organizationId, {
      patientId,
      status,
      limit,
      offset,
    });
  },
};
