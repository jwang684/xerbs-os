import { describe, expect, it } from "vitest";

import { AIEngine, createDefaultServices } from "../engine/AIEngine";
import type { AIProvider } from "../providers/AIProvider";
import { ProviderRegistry } from "../providers/ProviderRegistry";
import type { AssessmentResult } from "../schemas/assessment";
import { createAIContext } from "../types/AIContext";
import type { DiagnosisResult } from "../types/DiagnosisResult";
import type { FormulaResult } from "../types/FormulaResult";
import type { SummaryResult } from "../types/SummaryResult";
import { ModuleExecutionError } from "./BaseModule";
import { FormulaModule } from "./FormulaModule";

// Prior-module inputs. Their top-level keys are the valid evidence provenance
// sources the module accepts (Diagnosis ∪ Summary ∪ Assessment keys).
const diagnosis: DiagnosisResult = {
  candidates: [
    {
      pattern: "Spleen Qi Deficiency",
      rank: 1,
      reasoning: "Fatigue and poor appetite fit Qi deficiency.",
      supportingEvidence: [{ source: "significantFindings", text: "fatigue" }],
      conflictingEvidence: [],
    },
  ],
  insufficientEvidence: false,
  confidence: 0.7,
  confidenceReason: "clear, consistent evidence",
  uncertaintyNotes: [],
};

const summary: SummaryResult = {
  clinicalSummary: "Two weeks of fatigue and poor appetite.",
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
  confidenceReason: "preserved",
};

const assessment: AssessmentResult = {
  chiefComplaint: "Tired and poor appetite",
  presentingSymptoms: [{ name: "fatigue", severity: "moderate" }],
  symptomSummary: "Fatigue and poor appetite.",
  relevantHistory: [],
  redFlags: [],
  dataGaps: [],
  confidence: 0.7,
};

// A valid, guard-passing treatment strategy.
const validFormula: FormulaResult = {
  treatmentHypotheses: [
    {
      rank: 1,
      treatmentPrinciple: "Tonify Qi",
      formulaFamily: "Qi-tonifying formulas",
      reasoning: "Addresses the Qi deficiency identified in the diagnosis.",
      supportingEvidence: [{ source: "candidates", text: "Spleen Qi Deficiency" }],
      conflictingEvidence: [],
    },
  ],
  insufficientEvidence: false,
  confidence: 0.6,
  confidenceReason: "lowered: single supporting hypothesis",
  uncertaintyNotes: ["Tongue/pulse findings would refine the strategy."],
};

const clone = (f: FormulaResult): FormulaResult =>
  JSON.parse(JSON.stringify(f)) as FormulaResult;

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

// Runs FormulaModule (real formula.md, faked provider). Pass diagnosisInput: null
// to omit the Diagnosis (Guard 1).
function run(
  reply: unknown,
  opts: { diagnosisInput?: DiagnosisResult | null } = {},
) {
  const services = createDefaultServices({
    providers: new ProviderRegistry().register(fakeProvider(reply)),
  });
  const engine = new AIEngine(services).use(new FormulaModule());
  const results: Record<string, unknown> = { summary, assessment };
  const d = opts.diagnosisInput === undefined ? diagnosis : opts.diagnosisInput;
  if (d) results.diagnosis = d;
  return engine.run(createAIContext({ results }));
}

const asFormula = (ctx: { results: { formula?: unknown } }) =>
  ctx.results.formula as unknown as FormulaResult;

describe("FormulaModule", () => {
  it("produces a valid FormulaResult (treatment strategy)", async () => {
    const ctx = await run(validFormula);
    const f = asFormula(ctx);
    expect(f.treatmentHypotheses).toHaveLength(1);
    expect(f.treatmentHypotheses[0].treatmentPrinciple).toBe("Tonify Qi");
    expect(f.treatmentHypotheses[0].formulaFamily).toBe("Qi-tonifying formulas");
    expect(f.treatmentHypotheses[0].supportingEvidence[0].source).toBe(
      "candidates",
    );
    expect(f.confidenceReason).toBeTruthy();
  });

  it("allows lowering confidence below the Diagnosis's", async () => {
    const lowered = clone(validFormula);
    lowered.confidence = 0.3;
    lowered.confidenceReason = "lowered: uncertain differential";
    const ctx = await run(lowered);
    expect(asFormula(ctx).confidence).toBe(0.3);
  });

  it("Guard 1: fails when DiagnosisResult is missing", async () => {
    await expect(
      run(validFormula, { diagnosisInput: null }),
    ).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 2: fails when confidence exceeds Diagnosis confidence", async () => {
    const inflated = clone(validFormula);
    inflated.confidence = 0.9; // Diagnosis is 0.7
    await expect(run(inflated)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 3: fails when a hypothesis has no supporting evidence", async () => {
    const broken = clone(validFormula);
    broken.treatmentHypotheses[0].supportingEvidence = [];
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 4: fails when an evidence source is not from Diagnosis/Summary/Assessment", async () => {
    const broken = clone(validFormula);
    broken.treatmentHypotheses[0].supportingEvidence[0].source = "questionnaire";
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 5: fails when evidence text is empty", async () => {
    const broken = clone(validFormula);
    broken.treatmentHypotheses[0].supportingEvidence[0].text = "   ";
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 6: a single hypothesis must have rank 1", async () => {
    const broken = clone(validFormula);
    broken.treatmentHypotheses[0].rank = 2;
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 7: ranks must be continuous (rejects 1, 3)", async () => {
    const broken = clone(validFormula);
    broken.treatmentHypotheses = [
      { ...broken.treatmentHypotheses[0], rank: 1 },
      {
        ...broken.treatmentHypotheses[0],
        treatmentPrinciple: "Clear Heat",
        formulaFamily: "Heat-clearing formulas",
        rank: 3,
      },
    ];
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 8: treatmentPrinciple must not equal formulaFamily", async () => {
    const broken = clone(validFormula);
    broken.treatmentHypotheses[0].treatmentPrinciple = "Tonify Qi";
    broken.treatmentHypotheses[0].formulaFamily = "Tonify Qi";
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 9: rejects execution-level formatting (dosage / frequency)", async () => {
    for (const leak of ["10 mg", "5 g", "100 ml", "BID", "twice per day"]) {
      const broken = clone(validFormula);
      broken.treatmentHypotheses[0].formulaFamily = `Qi-tonifying formulas ${leak}`;
      await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
    }
  });

  it("accepts an explicit insufficient-evidence outcome (empty hypotheses)", async () => {
    const ie: FormulaResult = {
      treatmentHypotheses: [],
      insufficientEvidence: true,
      insufficientEvidenceReason: "Diagnosis too uncertain to commit a strategy.",
      confidence: 0.3,
      confidenceReason: "lowered: uncertain diagnosis",
      uncertaintyNotes: [],
    };
    const ctx = await run(ie);
    expect(asFormula(ctx).insufficientEvidence).toBe(true);
  });

  it("Schema: empty hypotheses without insufficientEvidence is rejected", async () => {
    const empty = clone(validFormula);
    empty.treatmentHypotheses = [];
    empty.insufficientEvidence = false;
    await expect(run(empty)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Schema: insufficientEvidenceReason required when insufficientEvidence is true", async () => {
    const bad = {
      treatmentHypotheses: [],
      insufficientEvidence: true,
      confidence: 0.3,
      confidenceReason: "sparse",
      uncertaintyNotes: [],
    };
    await expect(run(bad)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Schema: malformed output is rejected by FormulaSchema", async () => {
    await expect(
      run({ treatmentHypotheses: [], insufficientEvidence: true }),
    ).rejects.toBeInstanceOf(ModuleExecutionError); // missing confidence/confidenceReason
  });
});
