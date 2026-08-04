import { describe, expect, it } from "vitest";

import { createAIEngine } from "../bootstrap";
import type { AIProvider } from "../providers/AIProvider";
import { ProviderRegistry } from "../providers/ProviderRegistry";
import type { AssessmentResult } from "../schemas/assessment";
import { createAIContext } from "../types/AIContext";
import type { DiagnosisResult } from "../types/DiagnosisResult";
import type { SummaryResult } from "../types/SummaryResult";

// Consistent, guard-passing fixtures chained across the pipeline:
// Assessment → Summary (derived from it) → Diagnosis (derived from Summary).

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
      // Provenance points back to a Summary section.
      supportingEvidence: [{ source: "significantFindings", text: "fatigue" }],
      conflictingEvidence: [],
    },
  ],
  insufficientEvidence: false,
  confidence: 0.6, // <= Summary confidence
  confidenceReason: "lowered: a single supporting finding",
  uncertaintyNotes: ["Sleep information would help refine this."],
};

// One prompt-aware fake provider that answers each stage, keyed off a token
// unique to each template: the diagnosis prompt names "DiagnosisResult", the
// summary prompt calls the model a "summarizer"; assessment is the default.
const provider: AIProvider = {
  name: "fake",
  generate(req) {
    const p = req.prompt;
    const reply = p.includes("DiagnosisResult")
      ? diagnosis
      : p.includes("summarizer")
        ? summary
        : assessment;
    return Promise.resolve({ text: JSON.stringify(reply) });
  },
};

describe("AI pipeline integration (Assessment → Summary → Diagnosis)", () => {
  it("runs all three modules; Diagnosis consumes the Summary", async () => {
    const engine = createAIEngine({
      services: { providers: new ProviderRegistry().register(provider) },
    });
    expect(engine.registered).toEqual(["assessment", "summary", "diagnosis"]);

    const ctx = await engine.run(
      createAIContext({
        patient: { fullName: "Alice" },
        questionnaire: { sleep: "poor" },
      }),
    );

    const a = ctx.results.assessment as AssessmentResult | undefined;
    const s = ctx.results.summary as SummaryResult | undefined;
    const d = ctx.results.diagnosis as DiagnosisResult | undefined;

    // All three stages produced results under their own keys.
    expect(a?.chiefComplaint).toBe("Fatigue for two weeks");
    expect(s?.clinicalSummary).toBeTruthy();
    expect(d?.candidates).toHaveLength(1);
    expect(d?.candidates[0].pattern).toBe("Spleen Qi Deficiency");

    // Confidence never exceeds the Summary's (propagation held through the chain).
    expect(d ? d.confidence <= (s?.confidence ?? 0) : false).toBe(true);

    // Evidence provenance survives: the diagnosis cites a Summary section.
    expect(d?.candidates[0].supportingEvidence[0].source).toBe(
      "significantFindings",
    );
  });
});
