import type { Prescription } from "@/db/schema";

import { assertCanWrite, type AuthContext } from "../auth/authz";
import { diagnosisRepository } from "../diagnoses/diagnosis.repository";
import { BadRequestError, NotFoundError } from "../http/errors";
import { validate } from "../http/validate";
import { visitRepository } from "../visits/visit.repository";
import { getPrescriptionProvider } from "./ai";
import { prescriptionRepository } from "./prescription.repository";
import { visitIdParamSchema } from "./prescription.schema";

/**
 * Prescription business logic. A prescription is generated from the visit's
 * ACTIVE diagnosis (its structured clinical assessment) and stored immutably.
 * Belongs to exactly one diagnosis. No update or delete.
 */
export const prescriptionService = {
  async createForVisit(
    ctx: AuthContext,
    visitId: string,
  ): Promise<Prescription> {
    assertCanWrite(ctx);
    const vId = validate(visitIdParamSchema, visitId);

    const visit = await visitRepository.findById(ctx.organizationId, vId);
    if (!visit) {
      throw new NotFoundError("Visit not found in organization");
    }

    // Prescription is generated from the active diagnosis, not the visit.
    const activeDiagnosis = await diagnosisRepository.findActiveByVisit(
      ctx.organizationId,
      vId,
    );
    if (!activeDiagnosis) {
      throw new BadRequestError(
        "The visit has no active diagnosis to prescribe from",
      );
    }

    // Pass ONLY the structured clinical assessment to the AI provider.
    const structured = activeDiagnosis.structuredResult as {
      patterns?: Array<{ name: string; rationale: string }>;
      summary?: string;
    };
    const assessment = {
      patterns: structured.patterns ?? [],
      summary: structured.summary ?? "",
    };

    const provider = getPrescriptionProvider();
    const result = await provider.generatePrescription({ assessment });

    return prescriptionRepository.create(ctx.organizationId, {
      diagnosisId: activeDiagnosis.id,
      visitId: vId,
      patientId: activeDiagnosis.patientId,
      provider: result.provider,
      model: result.model,
      promptVersion: result.promptVersion,
      structuredResult: result.structuredResult as unknown as Record<
        string,
        unknown
      >,
      rawResponse: result.rawResponse,
      disclaimer: result.disclaimer,
    });
  },

  async listByVisit(
    ctx: AuthContext,
    visitId: string,
  ): Promise<Prescription[]> {
    const vId = validate(visitIdParamSchema, visitId);
    const visit = await visitRepository.findById(ctx.organizationId, vId);
    if (!visit) {
      throw new NotFoundError("Visit not found in organization");
    }
    return prescriptionRepository.listByVisit(ctx.organizationId, vId);
  },
};
