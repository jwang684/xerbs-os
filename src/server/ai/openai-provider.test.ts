import type OpenAI from "openai";
import { describe, expect, it } from "vitest";

import { OpenAiDiagnosisProvider } from "./openai-provider";

/**
 * Verifies the OpenAI Responses API integration (request construction +
 * response mapping) without any network call, by injecting a stub client.
 */
describe("OpenAiDiagnosisProvider", () => {
  it("calls the Responses API with structured output and maps the result", async () => {
    let capturedBody: Record<string, unknown> | undefined;
    const fakeResponse = {
      id: "resp_1",
      model: "gpt-4o-mini",
      output_parsed: {
        patterns: [{ name: "Damp Heat", rationale: "tongue + pulse" }],
        summary: "Likely damp heat.",
        reasoning: "Derived from the intake.",
        confidence: 0.8,
      },
    };

    const stubClient = {
      responses: {
        parse: async (body: Record<string, unknown>) => {
          capturedBody = body;
          return fakeResponse;
        },
      },
    } as unknown as OpenAI;

    const provider = new OpenAiDiagnosisProvider(stubClient, "gpt-4o-mini");
    const result = await provider.generateDiagnosis({
      questionnaire: { schemaVersion: 1, answers: { responses: [] } },
    });

    // Request was built correctly.
    expect(capturedBody?.model).toBe("gpt-4o-mini");
    expect(capturedBody?.text).toBeDefined();
    expect(String(capturedBody?.instructions)).toContain(
      "Traditional Chinese Medicine",
    );

    // Response was mapped correctly.
    expect(result.provider).toBe("openai");
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.promptVersion).toBe("v1");
    expect(result.structuredResult.patterns[0].name).toBe("Damp Heat");
    expect(result.structuredResult.summary).toBe("Likely damp heat.");
    expect(result.reasoning).toBe("Derived from the intake.");
    expect(result.confidence).toBe(0.8);
    expect(result.disclaimer).toContain("informational");
    expect(result.rawResponse).toBe(fakeResponse);
  });

  it("throws when the model returns no parsed output", async () => {
    const stubClient = {
      responses: {
        parse: async () => ({ model: "gpt-4o-mini", output_parsed: null }),
      },
    } as unknown as OpenAI;

    const provider = new OpenAiDiagnosisProvider(stubClient, "gpt-4o-mini");
    await expect(
      provider.generateDiagnosis({
        questionnaire: { schemaVersion: 1, answers: {} },
      }),
    ).rejects.toThrow();
  });
});
