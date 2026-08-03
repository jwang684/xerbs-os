import { describe, expect, it } from "vitest";

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
  symptomSummary: "Dull frontal headaches, worse in the afternoon; poor sleep.",
  redFlags: [],
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
  it("accepts a valid assessment and defaults redFlags", () => {
    const parsed = AssessmentSchema.parse({
      chiefComplaint: "x",
      symptomSummary: "y",
      confidence: 0.5,
    });
    expect(parsed.redFlags).toEqual([]);
  });

  it("rejects invalid output (bad confidence / missing fields)", () => {
    expect(AssessmentSchema.safeParse({ ...validResult, confidence: 2 }).success).toBe(
      false,
    );
    expect(AssessmentSchema.safeParse({ chiefComplaint: "only" }).success).toBe(
      false,
    );
  });
});

describe("assessment prompt", () => {
  it("loads assessment.md with input placeholders and safety rules", () => {
    const body = new FileTemplateLoader().load("assessment");
    expect(body).toContain("{{patient}}");
    expect(body).toContain("{{questionnaire}}");
    expect(body.toLowerCase()).toContain("json");
    // Must instruct against diagnosis / treatment / formulas.
    expect(body).toMatch(/diagnos/i);
    expect(body).toMatch(/formula/i);
    expect(body).toMatch(/treatment/i);
  });
});

describe("AssessmentModule", () => {
  it("runs the pipeline and stores a structured AssessmentResult", async () => {
    let seen: GenerateRequest | undefined;
    const services = servicesWith(fakeProvider(validResult, (r) => (seen = r)));
    const engine = new AIEngine(services).use(new AssessmentModule());

    const ctx = await engine.run(
      createAIContext({
        patient: { fullName: "Alice Example" },
        questionnaire: { responses: [{ q: "sleep", a: "poor" }] },
      }),
    );

    // Result is stored, typed, and matches the schema.
    expect(ctx.results.assessment).toMatchObject({
      chiefComplaint: "Headaches for two weeks",
      confidence: 0.7,
      redFlags: [],
    });
    // The prompt asked for JSON and embedded the patient input.
    expect(seen?.responseFormat).toBe("json");
    expect(seen?.prompt).toContain("Alice Example");
    expect(seen?.prompt).toContain("poor");
  });

  it("throws ModuleExecutionError when the model output is invalid", async () => {
    const services = servicesWith(fakeProvider({ chiefComplaint: "only" }));
    const engine = new AIEngine(services).use(new AssessmentModule());
    await expect(engine.run(createAIContext())).rejects.toBeInstanceOf(
      ModuleExecutionError,
    );
  });
});
