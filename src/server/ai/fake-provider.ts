import { DIAGNOSIS_DISCLAIMER, PROMPT_VERSION } from "./prompt";
import type {
  DiagnosisGenerationInput,
  DiagnosisGenerationResult,
  DiagnosisProvider,
} from "./provider";

/**
 * Deterministic diagnosis provider for tests and local development (no network,
 * no API key). Output is derived from the input so tests can assert on it.
 */
export class FakeDiagnosisProvider implements DiagnosisProvider {
  readonly name = "fake";

  async generateDiagnosis(
    input: DiagnosisGenerationInput,
  ): Promise<DiagnosisGenerationResult> {
    const answers = input.questionnaire.answers as
      | { responses?: unknown[] }
      | undefined;
    const responseCount = Array.isArray(answers?.responses)
      ? answers.responses.length
      : 0;

    return {
      provider: this.name,
      model: "fake-model-1",
      promptVersion: input.promptVersion ?? PROMPT_VERSION,
      reasoning: `Deterministic reasoning derived from ${responseCount} questionnaire responses.`,
      structuredResult: {
        patterns: [
          {
            name: "Qi Deficiency",
            rationale: "Placeholder pattern derived from the intake.",
          },
        ],
        summary: "Fake diagnostic summary for testing.",
      },
      confidence: 0.42,
      disclaimer: DIAGNOSIS_DISCLAIMER,
      rawResponse: { provider: this.name, echoedResponseCount: responseCount },
    };
  }
}
