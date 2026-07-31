import { z } from "zod";

import type { DiagnosisGenerationInput } from "./provider";

/** Bump when the prompt or output contract changes. Stored on each diagnosis. */
export const PROMPT_VERSION = "v1";

export const DIAGNOSIS_DISCLAIMER =
  "This AI-generated assessment is for informational purposes only and is not " +
  "a substitute for professional medical advice, diagnosis, or treatment.";

/**
 * Structured output contract for the diagnosis. Kept OpenAI strict-mode
 * compatible: every field required, no ranges — ranges are validated in code.
 */
export const diagnosisOutputSchema = z.object({
  patterns: z.array(
    z.object({
      name: z.string(),
      rationale: z.string(),
    }),
  ),
  summary: z.string(),
  reasoning: z.string(),
  confidence: z.number(),
});

export type DiagnosisOutput = z.infer<typeof diagnosisOutputSchema>;

export interface BuiltPrompt {
  instructions: string;
  userInput: string;
  promptVersion: string;
}

/** Builds the instructions + user input sent to the provider. */
export function buildDiagnosisPrompt(
  input: DiagnosisGenerationInput,
): BuiltPrompt {
  const instructions = [
    "You are a Traditional Chinese Medicine (TCM) clinical assistant.",
    "Given a patient's intake questionnaire, identify the most likely TCM",
    "syndrome patterns and provide a concise clinical summary.",
    "Do NOT prescribe herbs, formulas, dosages, or any treatment.",
    "Provide a confidence between 0 and 1.",
    "Respond strictly in the required JSON structure.",
  ].join(" ");

  const userInput = [
    `Questionnaire schema version: ${input.questionnaire.schemaVersion}`,
    "Questionnaire answers (JSON):",
    JSON.stringify(input.questionnaire.answers),
  ].join("\n");

  return {
    instructions,
    userInput,
    promptVersion: input.promptVersion ?? PROMPT_VERSION,
  };
}
