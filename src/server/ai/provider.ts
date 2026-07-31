/**
 * Provider-agnostic AI diagnosis interface.
 *
 * The service layer depends ONLY on these types — never on a concrete SDK. New
 * providers (OpenAI, Anthropic, Azure OpenAI, local models) implement
 * `DiagnosisProvider` and are selected by the factory in ./index.ts, so
 * swapping providers never touches the service or repository.
 */

export interface DiagnosisGenerationInput {
  questionnaire: {
    schemaVersion: number;
    answers: unknown;
  };
  promptVersion?: string;
}

export interface DiagnosisStructuredResult {
  patterns: Array<{ name: string; rationale: string }>;
  summary: string;
}

export interface DiagnosisGenerationResult {
  provider: string;
  model: string;
  promptVersion: string;
  reasoning: string | null;
  structuredResult: DiagnosisStructuredResult;
  confidence: number | null;
  disclaimer: string;
  /** The original, unmodified provider response. */
  rawResponse: unknown;
}

export interface DiagnosisProvider {
  readonly name: string;
  generateDiagnosis(
    input: DiagnosisGenerationInput,
  ): Promise<DiagnosisGenerationResult>;
}
