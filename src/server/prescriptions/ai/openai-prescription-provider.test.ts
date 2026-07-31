import type OpenAI from "openai";
import { describe, expect, it } from "vitest";

import { OpenAiPrescriptionProvider } from "./openai-prescription-provider";

/**
 * Verifies the OpenAI Responses API prescription integration (request +
 * response mapping) without any network call.
 */
describe("OpenAiPrescriptionProvider", () => {
  it("calls the Responses API with structured output and maps the result", async () => {
    let capturedBody: Record<string, unknown> | undefined;
    const fakeResponse = {
      id: "resp_1",
      model: "gpt-4o-mini",
      output_parsed: {
        formulaName: "Bu Zhong Yi Qi Tang",
        herbs: [
          { name: "Huang Qi", dosage: "15g" },
          { name: "Ren Shen", dosage: "9g" },
        ],
        instructions: "Decoct once daily.",
        durationDays: 14,
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

    const provider = new OpenAiPrescriptionProvider(stubClient, "gpt-4o-mini");
    const result = await provider.generatePrescription({
      assessment: {
        patterns: [{ name: "Qi Deficiency", rationale: "fatigue" }],
        summary: "Qi deficiency.",
      },
    });

    expect(capturedBody?.model).toBe("gpt-4o-mini");
    expect(capturedBody?.text).toBeDefined();
    expect(String(capturedBody?.instructions).toLowerCase()).toContain("herbal");

    expect(result.provider).toBe("openai");
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.promptVersion).toBe("v1");
    expect(result.structuredResult.formulaName).toBe("Bu Zhong Yi Qi Tang");
    expect(result.structuredResult.herbs).toHaveLength(2);
    expect(result.structuredResult.durationDays).toBe(14);
    expect(result.disclaimer).toContain("informational");
    expect(result.rawResponse).toBe(fakeResponse);
  });

  it("throws when the model returns no parsed output", async () => {
    const stubClient = {
      responses: {
        parse: async () => ({ model: "gpt-4o-mini", output_parsed: null }),
      },
    } as unknown as OpenAI;

    const provider = new OpenAiPrescriptionProvider(stubClient, "gpt-4o-mini");
    await expect(
      provider.generatePrescription({
        assessment: { patterns: [], summary: "" },
      }),
    ).rejects.toThrow();
  });
});
