import { describe, expect, it } from "vitest";

import { AIEngine, createDefaultServices } from "../engine/AIEngine";
import type { AIProvider } from "../providers/AIProvider";
import { ProviderRegistry } from "../providers/ProviderRegistry";
import type { AssessmentResult } from "../schemas/assessment";
import { createAIContext } from "../types/AIContext";
import type { SummaryResult } from "../types/SummaryResult";
import { ModuleExecutionError } from "./BaseModule";
import { SummaryModule } from "./SummaryModule";

// A representative, schema-valid AssessmentResult to summarize.
const assessment: AssessmentResult = {
  chiefComplaint: "Headaches for two weeks",
  presentingSymptoms: [
    {
      name: "frontal headache",
      duration: "2 weeks",
      onset: "gradual",
      severity: "moderate",
      notes: "worse in the afternoon",
    },
    { name: "poor sleep", severity: "unknown" },
  ],
  symptomSummary: "Frontal headaches for two weeks, worse in afternoons; poor sleep.",
  relevantHistory: ["No known drug allergies"],
  redFlags: ["sudden severe chest pain"],
  dataGaps: ["No hydration information provided"],
  confidence: 0.7,
};

// A faithful, guard-passing SummaryResult. Note the red-flag FINDING is reworded
// ("Acute severe chest pain") while its EVIDENCE preserves the original fact.
const validSummary: SummaryResult = {
  clinicalSummary:
    "Two weeks of afternoon-worse frontal headaches with poor sleep.",
  significantFindings: [
    {
      finding: "Frontal headache, worse in the afternoon",
      category: "head",
      priority: "high",
      evidence: [{ source: "presentingSymptoms", text: "frontal headache" }],
    },
    {
      finding: "Poor sleep",
      priority: "medium",
      evidence: [{ source: "presentingSymptoms", text: "poor sleep" }],
    },
  ],
  redFlags: [
    {
      finding: "Acute severe chest pain",
      priority: "high",
      evidence: [{ source: "redFlags", text: "sudden severe chest pain" }],
    },
  ],
  missingInformation: [{ field: "No hydration information provided" }],
  confidence: 0.7,
  confidenceReason: "preserved; no new evidence",
};

const clone = (s: SummaryResult): SummaryResult =>
  JSON.parse(JSON.stringify(s)) as SummaryResult;

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

// Runs SummaryModule with the given provider output over the given assessment.
// Pass `null` to run with no AssessmentResult in the context (Guard 1).
function run(reply: unknown, withAssessment: AssessmentResult | null = assessment) {
  const services = createDefaultServices({
    providers: new ProviderRegistry().register(fakeProvider(reply)),
  });
  const engine = new AIEngine(services).use(new SummaryModule());
  const ctx = withAssessment
    ? createAIContext({ results: { assessment: withAssessment } })
    : createAIContext();
  return engine.run(ctx);
}

describe("SummaryModule", () => {
  it("produces a valid SummaryResult; red-flag wording may change if evidence is preserved", async () => {
    const ctx = await run(validSummary);
    const summary = ctx.results.summary as unknown as SummaryResult;
    expect(summary.clinicalSummary).toContain("frontal headaches");
    expect(summary.significantFindings).toHaveLength(2);
    expect(summary.confidence).toBe(0.7);
    // Finding reworded, identity preserved via evidence.
    expect(summary.redFlags[0].finding).toBe("Acute severe chest pain");
    expect(summary.redFlags[0].evidence[0].text).toBe("sudden severe chest pain");
  });

  it("allows lowering confidence", async () => {
    const lowered = clone(validSummary);
    lowered.confidence = 0.4;
    lowered.confidenceReason = "lowered: thin data";
    const ctx = await run(lowered);
    expect((ctx.results.summary as unknown as SummaryResult).confidence).toBe(0.4);
  });

  it("Guard 1: fails when no AssessmentResult is present", async () => {
    await expect(run(validSummary, null)).rejects.toBeInstanceOf(
      ModuleExecutionError,
    );
  });

  it("Guard 2: fails when confidence exceeds Assessment confidence", async () => {
    const inflated = clone(validSummary);
    inflated.confidence = 0.9; // assessment is 0.7
    await expect(run(inflated)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 3: fails when a red flag is not traceable through evidence", async () => {
    const broken = clone(validSummary);
    broken.redFlags[0].evidence[0].text = "chest discomfort"; // no longer the fact
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 4: fails when a missing-information item is dropped", async () => {
    const broken = clone(validSummary);
    broken.missingInformation = [];
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 5: fails when a finding has no evidence", async () => {
    const broken = clone(validSummary);
    broken.significantFindings[0].evidence = [];
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 5: fails when an evidence source is not an Assessment section", async () => {
    const broken = clone(validSummary);
    broken.significantFindings[0].evidence[0].source = "questionnaire"; // raw input, not Assessment
    await expect(run(broken)).rejects.toBeInstanceOf(ModuleExecutionError);
  });

  it("Guard 6: fails schema validation for malformed output", async () => {
    await expect(run({ clinicalSummary: "x" })).rejects.toBeInstanceOf(
      ModuleExecutionError,
    );
  });
});
