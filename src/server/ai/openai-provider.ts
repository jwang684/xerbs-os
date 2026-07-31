import type OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  buildDiagnosisPrompt,
  DIAGNOSIS_DISCLAIMER,
  diagnosisOutputSchema,
} from "./prompt";
import type {
  DiagnosisGenerationInput,
  DiagnosisGenerationResult,
  DiagnosisProvider,
} from "./provider";

/**
 * OpenAI diagnosis provider using the Responses API with structured outputs.
 * This is the ONLY file that imports the OpenAI SDK; the client is injected so
 * it can be unit-tested without network access.
 */
export class OpenAiDiagnosisProvider implements DiagnosisProvider {
  readonly name = "openai";

  constructor(
    private readonly client: OpenAI,
    private readonly model: string,
  ) {}

  async generateDiagnosis(
    input: DiagnosisGenerationInput,
  ): Promise<DiagnosisGenerationResult> {
    const { instructions, userInput, promptVersion } =
      buildDiagnosisPrompt(input);

    const response = await this.client.responses.parse({
      model: this.model,
      instructions,
      input: userInput,
      text: { format: zodTextFormat(diagnosisOutputSchema, "diagnosis") },
    });

    const parsed = response.output_parsed;
    if (!parsed) {
      throw new Error("OpenAI returned no parsed diagnosis output");
    }

    return {
      provider: this.name,
      model: response.model ?? this.model,
      promptVersion,
      reasoning: parsed.reasoning,
      structuredResult: { patterns: parsed.patterns, summary: parsed.summary },
      confidence: parsed.confidence,
      disclaimer: DIAGNOSIS_DISCLAIMER,
      rawResponse: response,
    };
  }
}
