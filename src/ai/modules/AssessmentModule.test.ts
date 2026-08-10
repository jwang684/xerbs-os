import { describe, expect, it } from "vitest";

import { createAIEngine } from "../bootstrap";
import { AIEngine, createDefaultServices } from "../engine/AIEngine";
import type { AIProvider, GenerateRequest } from "../providers/AIProvider";
import { ProviderRegistry } from "../providers/ProviderRegistry";
import { FileTemplateLoader } from "../prompts/TemplateLoader";
import { AssessmentSchema } from "../schemas/assessment";
import { createAIContext } from "../types/AIContext";
import { ModuleExecutionError } from "./BaseModule";
import { AssessmentModule } from "./AssessmentModule";

const validResult = {
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
  symptomSummary: "Dull frontal headaches for two weeks, worse in the afternoon; poor sleep.",
  relevantHistory: ["No known drug allergies"],
  redFlags: [],
  dataGaps: ["No information on hydration or screen time"],
  confidence: 0.7,
};

function fakeProvider(
  reply: unknown,
  onRequest?: (req: GenerateRequest) => void,
): AIProvider {
  return {
    name: "fake",
    generate(req) {
      onRequest?.(req);
      return Promise.resolve({
        text: typeof reply === "string" ? reply : JSON.stringify(reply),
      });
    },
  };
}

function servicesWith(provider: AIProvider) {
  // Uses the real FileTemplateLoader (default) so the actual assessment.md is
  // exercised; only the provider is faked.
  return createDefaultServices({
    providers: new ProviderRegistry().register(provider),
  });
}

describe("AssessmentSchema", () => {
  it("accepts a full structured assessment", () => {
    const parsed = AssessmentSchema.parse(validResult);
    expect(parsed.presentingSymptoms).toHaveLength(2);
    expect(parsed.presentingSymptoms[0].severity).toBe("moderate");
  });

  it("defaults optional arrays and symptom severity", () => {
    const parsed = AssessmentSchema.parse({
      chiefComplaint: "x",
      symptomSummary: "y",
      presentingSymptoms: [{ name: "cough" }],
      confidence: 0.5,
    });
    expect(parsed.redFlags).toEqual([]);
    expect(parsed.relevantHistory).toEqual([]);
    expect(parsed.dataGaps).toEqual([]);
    expect(parsed.presentingSymptoms[0].severity).toBe("unknown");
  });

  it("rejects invalid output (bad confidence / bad severity / missing fields)", () => {
    expect(AssessmentSchema.safeParse({ ...validResult, confidence: 2 }).success).toBe(
      false,
    );
    expect(
      AssessmentSchema.safeParse({
        ...validResult,
        presentingSymptoms: [{ name: "x", severity: "extreme" }],
      }).success,
    ).toBe(false);
    expect(AssessmentSchema.safeParse({ chiefComplaint: "only" }).success).toBe(
      false,
    );
  });
});

describe("assessment prompt", () => {
  it("loads assessment.md with input placeholders, fields, and safety rules", () => {
    const body = new FileTemplateLoader().load("assessment");
    expect(body).toContain("{{patient}}");
    expect(body).toContain("{{questionnaire}}");
    expect(body).toContain("presentingSymptoms");
    expect(body).toContain("dataGaps");
    expect(body.toLowerCase()).toContain("json");
    // Must forbid diagnosis / treatment / formulas.
    expect(body).toMatch(/diagnos/i);
    expect(body).toMatch(/formula/i);
    expect(body).toMatch(/treatment/i);
  });
});

describe("AssessmentModule", () => {
  it("runs the pipeline and stores a high-quality structured result", async () => {
    let seen: GenerateRequest | undefined;
    const services = servicesWith(fakeProvider(validResult, (r) => (seen = r)));
    const engine = new AIEngine(services).use(new AssessmentModule());

    const ctx = await engine.run(
      createAIContext({
        patient: { fullName: "Alice Example" },
        questionnaire: { responses: [{ q: "sleep", a: "poor" }] },
      }),
    );

    expect(ctx.results.assessment).toMatchObject({
      chiefComplaint: "Headaches for two weeks",
      confidence: 0.7,
    });
    expect(ctx.results.assessment?.presentingSymptoms[0].name).toBe(
      "frontal headache",
    );
    // The prompt asked for JSON and embedded the patient input.
    expect(seen?.responseFormat).toBe("json");
    expect(seen?.prompt).toContain("Alice Example");
    expect(seen?.prompt).toContain("poor");
  });

  it("is runnable through the public createAIEngine entry point", async () => {
    // Scope to Assessment only (the default pipeline also includes Summary,
    // which this Assessment-focused test does not exercise).
    const engine = createAIEngine({
      modules: [new AssessmentModule()],
      services: { providers: new ProviderRegistry().register(fakeProvider(validResult)) },
    });
    expect(engine.registered).toEqual(["assessment"]);
    const ctx = await engine.run(
      createAIContext({ patient: { fullName: "Bob" } }),
    );
    expect(ctx.results.assessment?.chiefComplaint).toBe("Headaches for two weeks");
  });

  it("throws ModuleExecutionError when the model output is invalid", async () => {
    const services = servicesWith(fakeProvider({ chiefComplaint: "only" }));
    const engine = new AIEngine(services).use(new AssessmentModule());
    await expect(engine.run(createAIContext())).rejects.toBeInstanceOf(
      ModuleExecutionError,
    );
  });
});
