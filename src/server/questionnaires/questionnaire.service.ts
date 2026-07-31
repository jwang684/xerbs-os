import type { QuestionnaireResponse } from "@/db/schema";

import { assertCanWrite, type AuthContext } from "../auth/authz";
import { ConflictError, NotFoundError, ValidationError } from "../http/errors";
import { validate } from "../http/validate";
import { visitRepository } from "../visits/visit.repository";
import { questionnaireRepository } from "./questionnaire.repository";
import {
  createQuestionnaireSchema,
  isSupportedVersion,
  LATEST_QUESTIONNAIRE_VERSION,
  questionnaireContentSchemas,
  SUPPORTED_QUESTIONNAIRE_VERSIONS,
  updateQuestionnaireSchema,
  visitIdParamSchema,
} from "./questionnaire.schema";

/**
 * Validates questionnaire content against the Zod schema for `version`.
 * Version-safe: content is always checked against its declared version, and an
 * unknown version is rejected rather than silently accepted.
 */
function validateContent(
  version: number,
  answers: unknown,
): Record<string, unknown> {
  if (!isSupportedVersion(version)) {
    throw new ValidationError("Unsupported questionnaire schema version", {
      version,
      supported: SUPPORTED_QUESTIONNAIRE_VERSIONS,
    });
  }
  const schema = questionnaireContentSchemas[version];
  return validate(schema, answers) as Record<string, unknown>;
}

/**
 * Questionnaire business logic. A questionnaire belongs to exactly one visit;
 * all operations are keyed by visit and scoped to the caller's organization.
 */
export const questionnaireService = {
  async getByVisit(
    ctx: AuthContext,
    visitId: string,
  ): Promise<QuestionnaireResponse> {
    const vId = validate(visitIdParamSchema, visitId);
    const questionnaire = await questionnaireRepository.findByVisit(
      ctx.organizationId,
      vId,
    );
    if (!questionnaire) {
      throw new NotFoundError("Questionnaire not found");
    }
    return questionnaire;
  },

  async createForVisit(
    ctx: AuthContext,
    visitId: string,
    input: unknown,
  ): Promise<QuestionnaireResponse> {
    assertCanWrite(ctx);
    const vId = validate(visitIdParamSchema, visitId);
    const data = validate(createQuestionnaireSchema, input);

    const version = data.schemaVersion ?? LATEST_QUESTIONNAIRE_VERSION;
    const answers = validateContent(version, data.answers);

    // The visit must exist within the caller's organization.
    const visit = await visitRepository.findById(ctx.organizationId, vId);
    if (!visit) {
      throw new NotFoundError("Visit not found in organization");
    }

    // One questionnaire per visit.
    const existing = await questionnaireRepository.findByVisit(
      ctx.organizationId,
      vId,
    );
    if (existing) {
      throw new ConflictError("Questionnaire already exists for this visit");
    }

    return questionnaireRepository.create(ctx.organizationId, {
      visitId: vId,
      patientId: visit.patientId,
      schemaVersion: version,
      answers,
    });
  },

  async updateForVisit(
    ctx: AuthContext,
    visitId: string,
    input: unknown,
  ): Promise<QuestionnaireResponse> {
    assertCanWrite(ctx);
    const vId = validate(visitIdParamSchema, visitId);
    const data = validate(updateQuestionnaireSchema, input);

    const existing = await questionnaireRepository.findByVisit(
      ctx.organizationId,
      vId,
    );
    if (!existing) {
      throw new NotFoundError("Questionnaire not found");
    }

    if (data.schemaVersion === undefined && data.answers === undefined) {
      return existing;
    }

    // Version-safe: re-validate the (possibly unchanged) content against the
    // effective version, so changing the version alone can't leave invalid data.
    const version = data.schemaVersion ?? existing.schemaVersion;
    const rawAnswers =
      data.answers !== undefined ? data.answers : existing.answers;
    const answers = validateContent(version, rawAnswers);

    const updated = await questionnaireRepository.updateByVisit(
      ctx.organizationId,
      vId,
      { schemaVersion: version, answers },
    );
    if (!updated) {
      throw new NotFoundError("Questionnaire not found");
    }
    return updated;
  },
};
