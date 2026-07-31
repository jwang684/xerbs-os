/**
 * Provider-agnostic prescription AI interface.
 *
 * Prescription generation begins from a structured clinical assessment (the
 * output of a diagnosis) and never sees visits, questionnaires, or the DB. This
 * is deliberately separate from the diagnosis AI layer: the diagnosis providers
 * know nothing about prescriptions, and vice versa.
 */

export interface PrescriptionGenerationInput {
  // The structured clinical assessment produced by a diagnosis.
  assessment: {
    patterns: Array<{ name: string; rationale: string }>;
    summary: string;
  };
  promptVersion?: string;
}

export interface PrescriptionStructuredResult {
  formulaName: string;
  herbs: Array<{ name: string; dosage: string }>;
  instructions: string;
  durationDays: number;
}

export interface PrescriptionGenerationResult {
  provider: string;
  model: string;
  promptVersion: string;
  structuredResult: PrescriptionStructuredResult;
  disclaimer: string;
  /** The original, unmodified provider response. */
  rawResponse: unknown;
}

export interface PrescriptionProvider {
  readonly name: string;
  generatePrescription(
    input: PrescriptionGenerationInput,
  ): Promise<PrescriptionGenerationResult>;
}
