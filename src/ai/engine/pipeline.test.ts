import { describe, expect, it } from "vitest";

import { createAIEngine } from "../bootstrap";
import type { AIProvider } from "../providers/AIProvider";
import { ProviderRegistry } from "../providers/ProviderRegistry";
import type { AssessmentResult } from "../schemas/assessment";
import { createAIContext } from "../types/AIContext";
import type { DiagnosisResult } from "../types/DiagnosisResult";
import type { FormulaResult } from "../types/FormulaResult";
import type { SummaryResult } from "../types/SummaryResult";

// Consistent, guard-passing fixtures chained across the pipeline:
// Assessment → Summary → Diagnosis → Formula (each derived from the previous).

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

// One prompt-aware fake provider that answers each stage, keyed off a token
// unique to each template. Order matters: the formula prompt names BOTH
// "FormulaResult" (its output) and "DiagnosisResult" (its input), so check
// "FormulaResult" first.
const provider: AIProvider = {
  name: "fake",
  generate(req) {
    const p = req.prompt;
    const reply = p.includes("FormulaResult")
      ? formula
      : p.includes("DiagnosisResult")
        ? diagnosis
        : p.includes("summarizer")
          ? summary
          : assessment;
    return Promise.resolve({ text: JSON.stringify(reply) });
  },
};

describe("AI pipeline integration (Assessment → Summary → Diagnosis → Formula)", () => {
  it("runs all four modules; Formula consumes the Diagnosis", async () => {
    const engine = createAIEngine({
      services: { providers: new ProviderRegistry().register(provider) },
    });
    expect(engine.registered).toEqual([
      "assessment",
      "summary",
      "diagnosis",
      "formula",
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

    // All four stages produced results under their own keys.
    expect(a?.chiefComplaint).toBe("Fatigue for two weeks");
    expect(s?.clinicalSummary).toBeTruthy();
    expect(d?.candidates[0].pattern).toBe("Spleen Qi Deficiency");

    // Formula produced treatment hypotheses.
    expect(f?.treatmentHypotheses).toHaveLength(1);
    expect(f?.treatmentHypotheses[0].treatmentPrinciple).toBe("Tonify Qi");
    expect(f?.treatmentHypotheses[0].formulaFamily).toBe("Qi-tonifying formulas");

    // Confidence never exceeds the Diagnosis's (propagation held through the chain).
    expect(f ? f.confidence <= (d?.confidence ?? 0) : false).toBe(true);

    // Evidence provenance survives: the treatment strategy cites a Diagnosis section.
    expect(f?.treatmentHypotheses[0].supportingEvidence[0].source).toBe(
      "candidates",
    );
  });
});
