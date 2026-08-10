import { describe, expect, it } from "vitest";

import { AIEngine, createDefaultServices } from "../engine/AIEngine";
import type { AIProvider } from "../providers/AIProvider";
import { ProviderRegistry } from "../providers/ProviderRegistry";
import type { AssessmentResult } from "../schemas/assessment";
import { createAIContext } from "../types/AIContext";
import type { DiagnosisResult } from "../types/DiagnosisResult";
import type { SummaryResult } from "../types/SummaryResult";
import { ModuleExecutionError } from "./BaseModule";
import { DiagnosisModule } from "./DiagnosisModule";

// Prior-module inputs. Their top-level keys are the valid evidence provenance
// sources the module accepts (Summary keys ∪ Assessment keys).
const summary: SummaryResult = {
  clinicalSummary: "Two weeks of fatigue and irritability.",
  significantFindings: [
    {
      finding: "fatigue",
      priority: "high",
      evidence: [{ source: "presentingSymptoms", text: "fatigue" }],
    },
  ],
  redFlags: [],
  missingInformation: [],
  confidence: 0.7,
  confidenceReason: "preserved; no new evidence",
};

const assessment: AssessmentResult = {
  chiefComplaint: "Tired and irritable",
  presentingSymptoms: [{ name: "fatigue", severity: "moderate" }],
  symptomSummary: "Fatigue and irritability.",
  relevantHistory: [],
  redFlags: [],
  dataGaps: [],
  confidence: 0.7,
};

// A valid, guard-passing differential.
const validDiagnosis: DiagnosisResult = {
  candidates: [
    {
      pattern: "Spleen Qi Deficiency",
      rank: 1,
      reasoning: "Fatigue and poor energy fit Qi deficiency.",
      supportingEvidence: [{ source: "significantFindings", text: "fatigue" }],
      conflictingEvidence: [],
    },
    {
      pattern: "Liver Qi Stagnation",
      rank: 2,
      reasoning: "Irritability could indicate stagnation.",
      supportingEvidence: [{ source: "presentingSymptoms", text: "fatigue" }],
      conflictingEvidence: [
        { source: "significantFindings", text: "no reported stress" },
      ],
    },
  ],
  insufficientEvidence: false,
  confidence: 0.7,
  confidenceReason: "preserved; no new evidence",
  uncertaintyNotes: ["Tongue/pulse findings would help distinguish these."],
};

const clone = (d: DiagnosisResult): DiagnosisResult =>
  JSON.parse(JSON.stringify(d)) as DiagnosisResult;

function fakeProvider(reply: unknown): AIProvider {
  return {
    name: "fake",
    generate() {
      return Promise.resolve({
        text: typeof reply === "string" ? reply : JSON.stringify(reply),
      });
    },
  };
}

// Runs DiagnosisModule (real diagnosis.md prompt, faked provider) with the given
// prior results. Pass summaryInput: null to omit the Summary (Guard 1).
function run(
  reply: unknown,
  opts: {
    summaryInput?: SummaryResult | null;
    assessmentInput?: AssessmentResult;
  } = {},
) {
  const services = createDefaultServices({
    providers: new ProviderRegistry().register(fakeProvider(reply)),
  });
  const engine = new AIEngine(services).use(new DiagnosisModule());
  const results: Record<string, unknown> = {};
  const s = opts.summaryInput === undefined ? summary : opts.summaryInput;
  if (s) results.summary = s;
  results.assessment = opts.assessmentInput ?? assessment;
  return engine.run(createAIContext({ results }));
}

const asDiagnosis = (ctx: { results: { diagnosis?: unknown } }) =>
  ctx.results.diagnosis as unknown as DiagnosisResult;

describe("DiagnosisModule", () => {
  it("produces a valid DiagnosisResult (ranked differential)", async () => {
    const ctx = await run(validDiagnosis);
    const d = asDiagnosis(ctx);
    expect(d.candidates).toHaveLength(2);
    expect(d.candidates[0].pattern).toBe("Spleen Qi Deficiency");
    // Reasoning + confidenceReason preserved; provenance intact.
    expect(d.candidates[0].reasoning).toBeTruthy();
    expect(d.confidenceReason).toBe("preserved; no new evidence");
    expect(d.candidates[0].supportingEvidence[0].source).toBe(
      "significantFindings",
    );
  });

  it("allows lowering confidence below the Summary's", async () => {
    const lowered = clone(validDiagnosis);
    lowered.confidence = 0.4;
    lowered.confidenceReason = "lowered: conflicting evidence";
    const ctx = await run(lowered);
    expect(asDiagnosis(ctx).confidence).toBe(0.4);
  });

  it("Guard 1: fails when SummaryResult is missing", async () => {
    await expect(
      run(validDiagnosis, { summaryInput: null }),
    ).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 2: fails when confidence exceeds Summary confidence", async () => {
    const inflated = clone(validDiagnosis);
    inflated.confidence = 0.9; // Summary is 0.7
    await expect(run(inflated)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 3: fails when a candidate has no supporting evidence", async () => {
    const broken = clone(validDiagnosis);
    broken.candidates[0].supportingEvidence = [];
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 4: fails when an evidence source is not from Summary/Assessment", async () => {
    const broken = clone(validDiagnosis);
    broken.candidates[0].supportingEvidence[0].source = "questionnaire"; // raw input
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 5: conflicting evidence may be empty", async () => {
    const noConflicts = clone(validDiagnosis);
    noConflicts.candidates.forEach((c) => (c.conflictingEvidence = []));
    const ctx = await run(noConflicts);
    expect(asDiagnosis(ctx).candidates[1].conflictingEvidence).toEqual([]);
  });

  it("Guard 6: a single candidate must have rank 1", async () => {
    const broken = clone(validDiagnosis);
    broken.candidates = [{ ...broken.candidates[0], rank: 2 }];
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 7: candidate ranks must be continuous (rejects 1, 3, 4)", async () => {
    const broken = clone(validDiagnosis);
    broken.candidates = [
      { ...broken.candidates[0], rank: 1 },
      { ...broken.candidates[1], rank: 3 },
      { ...broken.candidates[1], pattern: "Third pattern", rank: 4 },
    ];
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("accepts an explicit insufficient-evidence outcome (empty candidates)", async () => {
    const ie: DiagnosisResult = {
      candidates: [],
      insufficientEvidence: true,
      insufficientEvidenceReason: "Too few corroborating findings.",
      confidence: 0.3,
      confidenceReason: "lowered: sparse evidence",
      uncertaintyNotes: ["Needs tongue and pulse."],
    };
    const ctx = await run(ie);
    expect(asDiagnosis(ctx).insufficientEvidence).toBe(true);
  });

  it("accepts insufficient evidence WITH tentative candidates (frozen spec §Example C)", async () => {
    const tentative = clone(validDiagnosis);
    tentative.candidates = [tentative.candidates[0]];
    tentative.insufficientEvidence = true;
    tentative.insufficientEvidenceReason = "Only one weakly-supported pattern.";
    const ctx = await run(tentative);
    expect(asDiagnosis(ctx).insufficientEvidence).toBe(true);
    expect(asDiagnosis(ctx).candidates).toHaveLength(1);
  });

  it("Guard 9: empty candidates without insufficientEvidence is rejected (schema)", async () => {
    const empty = clone(validDiagnosis);
    empty.candidates = [];
    empty.insufficientEvidence = false;
    await expect(run(empty)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("requires insufficientEvidenceReason when insufficientEvidence is true (schema)", async () => {
    const bad = {
      candidates: [],
      insufficientEvidence: true,
      confidence: 0.3,
      confidenceReason: "sparse",
      uncertaintyNotes: [],
    };
    await expect(run(bad)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 10: malformed output is rejected by DiagnosisSchema", async () => {
    await expect(
      run({ candidates: [], insufficientEvidence: true }),
    ).rejects.toBeInstanceOf(ModuleExecutionError); // missing confidence/confidenceReason
  });
});
// Note: Guard 8 ("insufficientEvidence ⇒ empty candidates") is intentionally NOT
// enforced — it contradicts the frozen clinical spec (Example C allows tentative
// candidates under an insufficient-evidence outcome); the spec-correct behavior is
// asserted above. Guards 6 and 7 (rank continuity) are enforced as runtime output
// integrity constraints.
