import type { SoapNote, SoapNoteRevision } from "@/db/schema";

import { assertCanWrite, type AuthContext } from "../auth/authz";
import { ConflictError, NotFoundError } from "../http/errors";
import { validate } from "../http/validate";
import { visitRepository } from "../visits/visit.repository";
import { soapRepository, type SoapSections } from "./soap.repository";
import {
  createSoapSchema,
  updateSoapSchema,
  visitIdParamSchema,
} from "./soap.schema";

function coalesce(input: Partial<SoapSections>): SoapSections {
  return {
    subjective: input.subjective ?? "",
    objective: input.objective ?? "",
    assessment: input.assessment ?? "",
    plan: input.plan ?? "",
  };
}

/**
 * SOAP note business logic. One note per visit; each save appends an immutable
 * revision. Editing permissions follow the Visit authorization: reads for any
 * member, writes for owner/admin/practitioner (staff read-only).
 */
export const soapService = {
  async getByVisit(ctx: AuthContext, visitId: string): Promise<SoapNote> {
    const vId = validate(visitIdParamSchema, visitId);
    const note = await soapRepository.findByVisit(ctx.organizationId, vId);
    if (!note) {
      throw new NotFoundError("SOAP note not found");
    }
    return note;
  },

  async create(
    ctx: AuthContext,
    visitId: string,
    input: unknown,
  ): Promise<SoapNote> {
    assertCanWrite(ctx);
    const vId = validate(visitIdParamSchema, visitId);
    const data = validate(createSoapSchema, input);

    const visit = await visitRepository.findById(ctx.organizationId, vId);
    if (!visit) {
      throw new NotFoundError("Visit not found in organization");
    }

    const existing = await soapRepository.findByVisit(ctx.organizationId, vId);
    if (existing) {
      throw new ConflictError("A SOAP note already exists for this visit");
    }

    return soapRepository.create(ctx.organizationId, {
      visitId: vId,
      patientId: visit.patientId,
      sections: coalesce(data),
      authorId: ctx.userId,
    });
  },

  async update(
    ctx: AuthContext,
    visitId: string,
    input: unknown,
  ): Promise<SoapNote> {
    assertCanWrite(ctx);
    const vId = validate(visitIdParamSchema, visitId);
    const data = validate(updateSoapSchema, input);

    // No-op autosave: don't create an empty revision.
    if (Object.keys(data).length === 0) {
      return this.getByVisit(ctx, vId);
    }

    const note = await soapRepository.update(
      ctx.organizationId,
      vId,
      data,
      ctx.userId,
    );
    if (!note) {
      throw new NotFoundError("SOAP note not found");
    }
    return note;
  },

  async remove(ctx: AuthContext, visitId: string): Promise<SoapNote> {
    assertCanWrite(ctx);
    const vId = validate(visitIdParamSchema, visitId);
    const note = await soapRepository.findByVisit(ctx.organizationId, vId);
    if (!note) {
      throw new NotFoundError("SOAP note not found");
    }
    await soapRepository.remove(ctx.organizationId, vId);
    return note;
  },

  async listRevisions(
    ctx: AuthContext,
    visitId: string,
  ): Promise<{ items: SoapNoteRevision[]; total: number }> {
    const vId = validate(visitIdParamSchema, visitId);
    const note = await soapRepository.findByVisit(ctx.organizationId, vId);
    if (!note) {
      throw new NotFoundError("SOAP note not found");
    }
    const items = await soapRepository.listRevisions(ctx.organizationId, vId);
    return { items, total: items.length };
  },
};
