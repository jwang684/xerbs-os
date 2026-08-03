import { describe, expect, it } from "vitest";

import { createAIEngine } from "../bootstrap";
import type { AIProvider } from "../providers/AIProvider";
import { ProviderRegistry } from "../providers/ProviderRegistry";
import type { AssessmentResult } from "../schemas/assessment";
import { createAIContext } from "../types/AIContext";
import type { SummaryResult } from "../types/SummaryResult";

// The Assessment the fake provider returns for the assessment prompt.
const assessment: AssessmentResult = {
  chiefComplaint: "Headaches for two weeks",
  presentingSymptoms: [
    { name: "frontal headache", duration: "2 weeks", severity: "moderate" },
    { name: "poor sleep", severity: "unknown" },
  ],
  symptomSummary: "Frontal headaches for two weeks; poor sleep.",
  relevantHistory: ["No known drug allergies"],
  redFlags: ["sudden severe chest pain"],
  dataGaps: ["No hydration information provided"],
  confidence: 0.7,
};

// A faithful Summary consistent with that Assessment (passes SummaryModule guards).
const summary: SummaryResult = {
  clinicalSummary: "Two weeks of frontal headaches with poor sleep.",
  significantFindings: [
    {
      finding: "Frontal headache",
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

// One fake provider that answers each stage by inspecting the prompt. The
// summary prompt uniquely calls the model a "summarizer".
const provider: AIProvider = {
  name: "fake",
  generate(req) {
    const isSummary = req.prompt.includes("summarizer");
    return Promise.resolve({
      text: JSON.stringify(isSummary ? summary : assessment),
    });
  },
};

describe("AI pipeline integration (Assessment → Summary)", () => {
  it("runs the default two-module pipeline; Summary consumes the Assessment", async () => {
    const engine = createAIEngine({
      services: { providers: new ProviderRegistry().register(provider) },
    });
    expect(engine.registered).toEqual(["assessment", "summary"]);

    const ctx = await engine.run(
      createAIContext({
        patient: { fullName: "Alice" },
        questionnaire: { sleep: "poor" },
      }),
    );

    const a = ctx.results.assessment as AssessmentResult | undefined;
    const s = ctx.results.summary as SummaryResult | undefined;

    // Both stages produced results, stored under their own keys.
    expect(a?.chiefComplaint).toBe("Headaches for two weeks");
    expect(s?.clinicalSummary).toBeTruthy();

    // Summary consumed the Assessment and honored the runtime guards.
    expect(s?.redFlags[0].evidence[0].text).toBe("sudden severe chest pain");
    expect(s?.missingInformation[0].field).toBe("No hydration information provided");
    expect(s ? s.confidence <= (a?.confidence ?? 0) : false).toBe(true);
  });
});
