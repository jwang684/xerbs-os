import {
  PRESCRIPTION_DISCLAIMER,
  PRESCRIPTION_PROMPT_VERSION,
} from "./prescription-prompt";
import type {
  PrescriptionGenerationInput,
  PrescriptionGenerationResult,
  PrescriptionProvider,
} from "./prescription-provider";

/**
 * Deterministic prescription provider for tests and local development (no
 * network, no API key). Output is derived from the assessment.
 */
export class FakePrescriptionProvider implements PrescriptionProvider {
  readonly name = "fake";

  async generatePrescription(
    input: PrescriptionGenerationInput,
  ): Promise<PrescriptionGenerationResult> {
    const primaryPattern =
      input.assessment.patterns[0]?.name ?? "Unspecified pattern";

    return {
      provider: this.name,
      model: "fake-model-1",
      promptVersion: input.promptVersion ?? PRESCRIPTION_PROMPT_VERSION,
      structuredResult: {
        formulaName: `Fake Formula for ${primaryPattern}`,
        herbs: [
          { name: "Huang Qi", dosage: "9g" },
          { name: "Dang Gui", dosage: "6g" },
        ],
        instructions: "Decoct once daily; take warm, morning and evening.",
        durationDays: 7,
      },
      disclaimer: PRESCRIPTION_DISCLAIMER,
      rawResponse: { provider: this.name, basedOnPattern: primaryPattern },
    };
  }
}
