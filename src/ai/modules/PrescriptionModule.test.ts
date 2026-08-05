import { describe, expect, it } from "vitest";

import { AIEngine, createDefaultServices } from "../engine/AIEngine";
import type { AIProvider } from "../providers/AIProvider";
import { ProviderRegistry } from "../providers/ProviderRegistry";
import type { AssessmentResult } from "../schemas/assessment";
import { createAIContext } from "../types/AIContext";
import type { DiagnosisResult } from "../types/DiagnosisResult";
import type { FormulaResult } from "../types/FormulaResult";
import type {
  ExecutablePrescription,
  PrescriptionResult,
} from "../types/PrescriptionResult";
import type { SummaryResult } from "../types/SummaryResult";
import { ModuleExecutionError } from "./BaseModule";
import { PrescriptionModule } from "./PrescriptionModule";

// Prior-module inputs. Their top-level keys are the valid evidence provenance
// sources the module accepts (Formula ∪ Diagnosis ∪ Summary ∪ Assessment keys).
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

// The PRIMARY input — a valid treatment strategy. Its top-level keys (notably
// `treatmentHypotheses`) are valid evidence provenance sources, and its
// confidence (0.6) is the ceiling Prescription confidence may not exceed.
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
  uncertaintyNotes: [],
};

// A valid, guard-passing executable prescription (confidence <= Formula's 0.6).
const validPrescription: PrescriptionResult = {
  prescription: {
    formulaName: "Bu Zhong Yi Qi Tang",
    modifications: [],
    herbs: [
      { name: "Huang Qi", quantity: "15g" },
      { name: "Ren Shen", quantity: "9g" },
    ],
    dosage: "one packet",
    administration: "decoct in water, taken twice daily",
    duration: "14 days",
    reasoning:
      "Operationalizes the Qi-tonifying strategy for the diagnosed deficiency.",
    supportingEvidence: [{ source: "treatmentHypotheses", text: "Tonify Qi" }],
    conflictingEvidence: [],
  },
  insufficientEvidence: false,
  confidence: 0.6,
  confidenceReason: "preserved from the treatment strategy",
  uncertaintyNotes: [],
};

const clone = (p: PrescriptionResult): PrescriptionResult =>
  JSON.parse(JSON.stringify(p)) as PrescriptionResult;

/**
 * Build a variant of `validPrescription` by mutating its (present) executable
 * prescription. The `if (c.prescription)` narrowing keeps this non-null-assertion
 * free.
 */
function withRx(
  mutate: (rx: ExecutablePrescription) => void,
): PrescriptionResult {
  const c = clone(validPrescription);
  if (c.prescription) mutate(c.prescription);
  return c;
}

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

// Runs PrescriptionModule (real prescription.md, faked provider). Pass
// formulaInput: null to omit the Formula (Guard 1). Diagnosis/Summary/Assessment
// are always supplied as context (their keys are valid evidence sources).
function run(reply: unknown, opts: { formulaInput?: FormulaResult | null } = {}) {
  const services = createDefaultServices({
    providers: new ProviderRegistry().register(fakeProvider(reply)),
  });
  const engine = new AIEngine(services).use(new PrescriptionModule());
  const results: Record<string, unknown> = { diagnosis, summary, assessment };
  const f = opts.formulaInput === undefined ? validFormula : opts.formulaInput;
  if (f) results.formula = f;
  return engine.run(createAIContext({ results }));
}

const asPrescription = (ctx: { results: { prescription?: unknown } }) =>
  ctx.results.prescription as unknown as PrescriptionResult;

describe("PrescriptionModule", () => {
  // ---- Happy path -----------------------------------------------------------

  it("produces a valid PrescriptionResult and preserves execution detail", async () => {
    const ctx = await run(validPrescription);
    const p = asPrescription(ctx);
    const rx = p.prescription;

    expect(p.insufficientEvidence).toBe(false);
    expect(rx?.formulaName).toBe("Bu Zhong Yi Qi Tang");
    // Herb composition preserved (names + quantities).
    expect(rx?.herbs).toEqual([
      { name: "Huang Qi", quantity: "15g" },
      { name: "Ren Shen", quantity: "9g" },
    ]);
    expect(rx?.dosage).toBe("one packet");
    expect(rx?.administration).toBe("decoct in water, taken twice daily");
    expect(rx?.duration).toBe("14 days");
    expect(p.confidenceReason).toBe("preserved from the treatment strategy");
    // Supporting-evidence provenance preserved (traces back to the Formula).
    expect(rx?.supportingEvidence[0].source).toBe("treatmentHypotheses");
  });

  // ---- Confidence propagation ----------------------------------------------

  it("allows lowering confidence below the Formula's", async () => {
    const lowered = clone(validPrescription);
    lowered.confidence = 0.3;
    lowered.confidenceReason = "lowered: execution-relevant detail missing";
    const ctx = await run(lowered);
    expect(asPrescription(ctx).confidence).toBe(0.3);
  });

  // ---- Runtime guards -------------------------------------------------------

  it("Guard 1: fails when FormulaResult is missing", async () => {
    await expect(
      run(validPrescription, { formulaInput: null }),
    ).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 2: fails when confidence exceeds Formula confidence", async () => {
    const inflated = clone(validPrescription);
    inflated.confidence = 0.9; // Formula is 0.6
    await expect(run(inflated)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 3: fails when the prescription has no supporting evidence", async () => {
    const broken = withRx((rx) => {
      rx.supportingEvidence = [];
    });
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 4: fails when an evidence source is not from Formula/Diagnosis/Summary/Assessment", async () => {
    const broken = withRx((rx) => {
      rx.supportingEvidence[0].source = "questionnaire";
    });
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 5: fails when evidence text is blank", async () => {
    const broken = withRx((rx) => {
      rx.supportingEvidence[0].text = "   ";
    });
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  // Guard 6 — exactly one executable prescription — needs no test. It is
  // structurally guaranteed by PrescriptionSchema, which models a single optional
  // `prescription` object and never an array, so multiple prescriptions are
  // unrepresentable and could not survive validation to reach the module.

  it("Guard 7: rejects a blank formulaName", async () => {
    const broken = withRx((rx) => {
      rx.formulaName = "   ";
    });
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 7: rejects a blank dosage", async () => {
    const broken = withRx((rx) => {
      rx.dosage = "   ";
    });
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 7: rejects a blank administration", async () => {
    const broken = withRx((rx) => {
      rx.administration = "   ";
    });
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 7: rejects a blank duration", async () => {
    const broken = withRx((rx) => {
      rx.duration = "   ";
    });
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 7: rejects zero herbs (a contentless prescription)", async () => {
    const broken = withRx((rx) => {
      rx.herbs = [];
    });
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 7: rejects a blank herb name", async () => {
    const broken = withRx((rx) => {
      rx.herbs[0].name = "   ";
    });
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 7: rejects a blank herb quantity", async () => {
    const broken = withRx((rx) => {
      rx.herbs[0].quantity = "   ";
    });
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  // Guard 8 (no confidence inflation) is the same numeric bound as Guard 2 and is
  // covered by the "confidence exceeds Formula confidence" test above.

  it("Guard 9: malformed output is rejected by PrescriptionSchema", async () => {
    const malformed = {
      prescription: validPrescription.prescription,
      insufficientEvidence: false,
      confidence: "high", // not a number
      confidenceReason: "x",
      uncertaintyNotes: [],
    };
    await expect(run(malformed)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  // ---- Schema refinements (the two valid states, and the three invalid) -----

  it("State A: prescription present + insufficientEvidence false passes", async () => {
    const ctx = await run(validPrescription);
    expect(asPrescription(ctx).prescription?.formulaName).toBe(
      "Bu Zhong Yi Qi Tang",
    );
  });

  it("State B: prescription absent + insufficientEvidence true (with reason) passes", async () => {
    const ie: PrescriptionResult = {
      insufficientEvidence: true,
      insufficientEvidenceReason:
        "Cannot safely operationalize the strategy without dosing knowledge.",
      confidence: 0.3,
      confidenceReason: "lowered: unable to converge safely",
      uncertaintyNotes: [],
    };
    const ctx = await run(ie);
    const p = asPrescription(ctx);
    expect(p.insufficientEvidence).toBe(true);
    expect(p.prescription).toBeUndefined();
  });

  it("State C: prescription absent + insufficientEvidence false is rejected", async () => {
    const bad = {
      insufficientEvidence: false,
      confidence: 0.5,
      confidenceReason: "x",
      uncertaintyNotes: [],
    };
    await expect(run(bad)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("State D: insufficientEvidence true without a reason is rejected", async () => {
    const bad = {
      insufficientEvidence: true,
      confidence: 0.3,
      confidenceReason: "x",
      uncertaintyNotes: [],
    };
    await expect(run(bad)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("State E: prescription present AND insufficientEvidence true is rejected (mutual exclusivity)", async () => {
    const bad = {
      prescription: validPrescription.prescription,
      insufficientEvidence: true,
      insufficientEvidenceReason: "contradictory outcome",
      confidence: 0.3,
      confidenceReason: "x",
      uncertaintyNotes: [],
    };
    await expect(run(bad)).rejects.toBeInstanceOf(ModuleExecutionError);
  });
});
