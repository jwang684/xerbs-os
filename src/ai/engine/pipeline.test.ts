import { describe, expect, it } from "vitest";

import { createAIEngine } from "../bootstrap";
import type { AIProvider } from "../providers/AIProvider";
import { ProviderRegistry } from "../providers/ProviderRegistry";
import type { AssessmentResult } from "../schemas/assessment";
import { createAIContext } from "../types/AIContext";
import type { DiagnosisResult } from "../types/DiagnosisResult";
import type { FormulaResult } from "../types/FormulaResult";
import type { PrescriptionResult } from "../types/PrescriptionResult";
import type { SummaryResult } from "../types/SummaryResult";

// Consistent, guard-passing fixtures chained across the pipeline:
// Assessment → Summary → Diagnosis → Formula → Prescription (each derived from
// the previous).

const assessment: AssessmentResult = {
  chiefComplaint: "Fatigue for two weeks",
  presentingSymptoms: [
    { name: "fatigue", duration: "2 weeks", severity: "moderate" },
  ],
  symptomSummary: "Two weeks of fatigue.",
  relevantHistory: [],
  redFlags: [],
  dataGaps: ["No sleep information provided"],
  confidence: 0.7,
};

const summary: SummaryResult = {
  clinicalSummary: "Two weeks of fatigue.",
  significantFindings: [
    {
      finding: "fatigue",
      priority: "high",
      evidence: [{ source: "presentingSymptoms", text: "fatigue" }],
    },
  ],
  redFlags: [],
  missingInformation: [{ field: "No sleep information provided" }],
  confidence: 0.7,
  confidenceReason: "preserved; no new evidence",
};

const diagnosis: DiagnosisResult = {
  candidates: [
    {
      pattern: "Spleen Qi Deficiency",
      rank: 1,
      reasoning: "Persistent fatigue is consistent with Qi deficiency.",
      supportingEvidence: [{ source: "significantFindings", text: "fatigue" }],
      conflictingEvidence: [],
    },
  ],
  insufficientEvidence: false,
  confidence: 0.6, // <= Summary confidence
  confidenceReason: "lowered: a single supporting finding",
  uncertaintyNotes: ["Sleep information would help refine this."],
};

const formula: FormulaResult = {
  treatmentHypotheses: [
    {
      rank: 1,
      treatmentPrinciple: "Tonify Qi",
      formulaFamily: "Qi-tonifying formulas",
      reasoning: "Addresses the diagnosed Qi deficiency.",
      // Provenance points back to a Diagnosis section.
      supportingEvidence: [
        { source: "candidates", text: "Spleen Qi Deficiency" },
      ],
      conflictingEvidence: [],
    },
  ],
  insufficientEvidence: false,
  confidence: 0.6, // <= Diagnosis confidence
  confidenceReason: "preserved; no new evidence",
  uncertaintyNotes: [],
};

const prescription: PrescriptionResult = {
  prescription: {
    formulaName: "Bu Zhong Yi Qi Tang",
    modifications: [],
    herbs: [{ name: "Huang Qi", quantity: "15g" }],
    dosage: "one packet",
    administration: "decoct in water, taken twice daily",
    duration: "14 days",
    reasoning: "Operationalizes the Qi-tonifying strategy.",
    // Provenance points back to a Formula section.
    supportingEvidence: [{ source: "treatmentHypotheses", text: "Tonify Qi" }],
    conflictingEvidence: [],
  },
  insufficientEvidence: false,
  confidence: 0.6, // <= Formula confidence
  confidenceReason: "preserved; no new evidence",
  uncertaintyNotes: [],
};

// Non-convergence fixtures: Formula cannot commit to a strategy, so Prescription
// must decline to prescribe rather than fabricate execution.
const insufficientFormula: FormulaResult = {
  treatmentHypotheses: [],
  insufficientEvidence: true,
  insufficientEvidenceReason:
    "The diagnosis is too uncertain to commit to a treatment strategy.",
  confidence: 0.3, // <= Diagnosis confidence
  confidenceReason: "lowered: unable to commit a strategy",
  uncertaintyNotes: [],
};

const insufficientPrescription: PrescriptionResult = {
  insufficientEvidence: true,
  insufficientEvidenceReason:
    "No treatment strategy to operationalize; cannot converge on a prescription.",
  confidence: 0.3, // <= Formula confidence
  confidenceReason: "preserved; the strategy itself was insufficient",
  uncertaintyNotes: [],
};

// One prompt-aware fake provider that answers each stage, keyed off a token
// unique to each template. Order matters — check the MOST SPECIFIC output first:
// the prescription prompt names "PrescriptionResult" and "FormulaResult", and the
// formula prompt names "FormulaResult" and "DiagnosisResult". So the checks go
// most-specific → least: Prescription, Formula, Diagnosis, Summary, Assessment.
const provider: AIProvider = {
  name: "fake",
  generate(req) {
    const p = req.prompt;
    const reply = p.includes("PrescriptionResult")
      ? prescription
      : p.includes("FormulaResult")
        ? formula
        : p.includes("DiagnosisResult")
          ? diagnosis
          : p.includes("summarizer")
            ? summary
            : assessment;
    return Promise.resolve({ text: JSON.stringify(reply) });
  },
};

// Same discriminator (most-specific first), but the Formula and Prescription
// stages both return an insufficient-evidence outcome.
const nonConvergingProvider: AIProvider = {
  name: "fake",
  generate(req) {
    const p = req.prompt;
    const reply = p.includes("PrescriptionResult")
      ? insufficientPrescription
      : p.includes("FormulaResult")
        ? insufficientFormula
        : p.includes("DiagnosisResult")
          ? diagnosis
          : p.includes("summarizer")
            ? summary
            : assessment;
    return Promise.resolve({ text: JSON.stringify(reply) });
  },
};

describe("AI pipeline integration (Assessment → Summary → Diagnosis → Formula → Prescription)", () => {
  it("runs all five modules; Prescription consumes the Formula", async () => {
    const engine = createAIEngine({
      services: { providers: new ProviderRegistry().register(provider) },
    });
    expect(engine.registered).toEqual([
      "assessment",
      "summary",
      "diagnosis",
      "formula",
      "prescription",
    ]);

    const ctx = await engine.run(
      createAIContext({
        patient: { fullName: "Alice" },
        questionnaire: { sleep: "poor" },
      }),
    );

    const a = ctx.results.assessment as AssessmentResult | undefined;
    const s = ctx.results.summary as SummaryResult | undefined;
    const d = ctx.results.diagnosis as DiagnosisResult | undefined;
    const f = ctx.results.formula as FormulaResult | undefined;
    const rx = ctx.results.prescription as PrescriptionResult | undefined;

    // All five stages produced results under their own keys.
    expect(a?.chiefComplaint).toBe("Fatigue for two weeks");
    expect(s?.clinicalSummary).toBeTruthy();
    expect(d?.candidates[0].pattern).toBe("Spleen Qi Deficiency");

    // Formula produced treatment hypotheses.
    expect(f?.treatmentHypotheses).toHaveLength(1);
    expect(f?.treatmentHypotheses[0].treatmentPrinciple).toBe("Tonify Qi");
    expect(f?.treatmentHypotheses[0].formulaFamily).toBe("Qi-tonifying formulas");

    // Prescription produced exactly one executable prescription.
    expect(rx?.prescription?.formulaName).toBe("Bu Zhong Yi Qi Tang");
    expect(rx?.insufficientEvidence).toBe(false);

    // Confidence never exceeds the Formula's (propagation held to the last stage).
    expect(rx ? rx.confidence <= (f?.confidence ?? 0) : false).toBe(true);

    // Evidence provenance survives: the prescription cites a Formula section.
    expect(rx?.prescription?.supportingEvidence[0].source).toBe(
      "treatmentHypotheses",
    );

    // Upstream results are immutable — Formula and Diagnosis pass through unchanged.
    expect(f).toEqual(formula);
    expect(d).toEqual(diagnosis);
  });

  it("propagates non-convergence: an insufficient Formula yields an insufficient Prescription (no fabricated execution)", async () => {
    const engine = createAIEngine({
      services: {
        providers: new ProviderRegistry().register(nonConvergingProvider),
      },
    });

    const ctx = await engine.run(
      createAIContext({
        patient: { fullName: "Alice" },
        questionnaire: { sleep: "poor" },
      }),
    );

    const a = ctx.results.assessment as AssessmentResult | undefined;
    const s = ctx.results.summary as SummaryResult | undefined;
    const d = ctx.results.diagnosis as DiagnosisResult | undefined;
    const f = ctx.results.formula as FormulaResult | undefined;
    const rx = ctx.results.prescription as PrescriptionResult | undefined;

    // 1. The pipeline executed all the way through Prescription.
    expect(engine.registered).toContain("prescription");
    expect(rx).toBeDefined();

    // 2. Formula did not converge on a strategy.
    expect(f?.insufficientEvidence).toBe(true);
    expect(f?.treatmentHypotheses).toHaveLength(0);

    // 3-5. Prescription also declined to converge and fabricated NO executable
    // prescription (the invariant under test).
    expect(rx?.insufficientEvidence).toBe(true);
    expect(rx?.prescription).toBeUndefined();
    expect(rx?.insufficientEvidenceReason).toBeTruthy();

    // 6-7. Upstream results are unchanged; nothing was mutated in place.
    expect(a).toEqual(assessment);
    expect(s).toEqual(summary);
    expect(d).toEqual(diagnosis);
    expect(f).toEqual(insufficientFormula);
  });
});
