import type OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  buildPrescriptionPrompt,
  PRESCRIPTION_DISCLAIMER,
  prescriptionOutputSchema,
} from "./prescription-prompt";
import type {
  PrescriptionGenerationInput,
  PrescriptionGenerationResult,
  PrescriptionProvider,
} from "./prescription-provider";

/**
 * OpenAI prescription provider using the Responses API with structured outputs.
 * The client is injected so it can be unit-tested without network access.
 */
export class OpenAiPrescriptionProvider implements PrescriptionProvider {
  readonly name = "openai";

  constructor(
    private readonly client: OpenAI,
    private readonly model: string,
  ) {}

  async generatePrescription(
    input: PrescriptionGenerationInput,
  ): Promise<PrescriptionGenerationResult> {
    const { instructions, userInput, promptVersion } =
      buildPrescriptionPrompt(input);

    const response = await this.client.responses.parse({
      model: this.model,
      instructions,
      input: userInput,
      text: { format: zodTextFormat(prescriptionOutputSchema, "prescription") },
    });

    const parsed = response.output_parsed;
    if (!parsed) {
      throw new Error("OpenAI returned no parsed prescription output");
    }

    return {
      provider: this.name,
      model: response.model ?? this.model,
      promptVersion,
      structuredResult: parsed,
      disclaimer: PRESCRIPTION_DISCLAIMER,
      rawResponse: response,
    };
  }
}
