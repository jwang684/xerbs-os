import { z } from "zod";

import type { PrescriptionGenerationInput } from "./prescription-provider";

export const PRESCRIPTION_PROMPT_VERSION = "v1";

export const PRESCRIPTION_DISCLAIMER =
  "This AI-generated herbal prescription is for informational purposes only and " +
  "must be reviewed and approved by a qualified practitioner before use. It is " +
  "not a substitute for professional medical advice, diagnosis, or treatment.";

/**
 * Structured output contract for a prescription. OpenAI strict-mode compatible:
 * every field required, no numeric ranges.
 */
export const prescriptionOutputSchema = z.object({
  formulaName: z.string(),
  herbs: z.array(
    z.object({
      name: z.string(),
      dosage: z.string(),
    }),
  ),
  instructions: z.string(),
  durationDays: z.number(),
});

export type PrescriptionOutput = z.infer<typeof prescriptionOutputSchema>;

export interface BuiltPrescriptionPrompt {
  instructions: string;
  userInput: string;
  promptVersion: string;
}

export function buildPrescriptionPrompt(
  input: PrescriptionGenerationInput,
): BuiltPrescriptionPrompt {
  const instructions = [
    "You are a Traditional Chinese Medicine (TCM) herbal-medicine assistant.",
    "Given a structured clinical assessment (syndrome patterns and a summary),",
    "propose a single, coherent herbal formula: a formula name, its herbs with",
    "dosages, preparation/administration instructions, and a duration in days.",
    "Base the formula only on the provided assessment.",
    "Respond strictly in the required JSON structure.",
  ].join(" ");

  const userInput = [
    "Clinical assessment (JSON):",
    JSON.stringify(input.assessment),
  ].join("\n");

  return {
    instructions,
    userInput,
    promptVersion: input.promptVersion ?? PRESCRIPTION_PROMPT_VERSION,
  };
}
