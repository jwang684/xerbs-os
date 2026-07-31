import { z } from "zod";

/**
 * Version-safe questionnaire content.
 *
 * The questionnaire body is generic structured JSON — a list of answered
 * questions — never fixed DB columns. Each stored questionnaire records the
 * `schemaVersion` it was validated against, and this registry maps a version to
 * its Zod definition. To evolve the questionnaire, add a new version here (and a
 * new Zod schema); existing rows keep validating against their own version and
 * no database migration is required.
 */

const answerValueSchema = z.union([
  z.string().max(5000),
  z.number(),
  z.boolean(),
  z.array(z.string().max(500)).max(200),
  z.null(),
]);

// Version 1 — a generic set of question responses.
const contentSchemaV1 = z
  .object({
    responses: z
      .array(
        z
          .object({
            questionId: z.string().trim().min(1).max(100),
            value: answerValueSchema,
          })
          .strict(),
      )
      .max(500),
  })
  .strict();

export const questionnaireContentSchemas = {
  1: contentSchemaV1,
} as const;

export type QuestionnaireSchemaVersion =
  keyof typeof questionnaireContentSchemas;

export const LATEST_QUESTIONNAIRE_VERSION: QuestionnaireSchemaVersion = 1;

export const SUPPORTED_QUESTIONNAIRE_VERSIONS = Object.keys(
  questionnaireContentSchemas,
).map(Number);

/** True if `v` is a version this build knows how to validate. */
export function isSupportedVersion(
  v: number,
): v is QuestionnaireSchemaVersion {
  return v in questionnaireContentSchemas;
}

// Envelope validation: shape of the request, independent of content version.
export const createQuestionnaireSchema = z.object({
  schemaVersion: z.number().int().optional(),
  answers: z.unknown(),
});

export const updateQuestionnaireSchema = z.object({
  schemaVersion: z.number().int().optional(),
  answers: z.unknown().optional(),
});

export const visitIdParamSchema = z.uuid("Invalid visit id");
