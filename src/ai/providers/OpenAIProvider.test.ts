import { describe, expect, it } from "vitest";

import { OpenAIProvider } from "./OpenAIProvider";

/**
 * Verifies request construction + response mapping without a network call, by
 * injecting a stub client. No OpenAI types are referenced here.
 */
describe("OpenAIProvider", () => {
  function stub(capture: { body?: Record<string, unknown> }) {
    return {
      responses: {
        create: (body: Record<string, unknown>) => {
          capture.body = body;
          return Promise.resolve({
            output_text: '{"ok":true}',
            model: "resolved-model",
            usage: { total_tokens: 10 },
          });
        },
      },
    };
  }

  it("maps a GenerateRequest onto the Responses API and returns text", async () => {
    const capture: { body?: Record<string, unknown> } = {};
    const provider = new OpenAIProvider({ model: "m1", client: stub(capture) });

    const result = await provider.generate({
      prompt: "hello",
      system: "be terse",
      responseFormat: "json",
      temperature: 0.4,
      maxTokens: 128,
    });

    expect(provider.name).toBe("openai");
    expect(capture.body?.model).toBe("m1");
    expect(capture.body?.input).toBe("hello");
    expect(capture.body?.instructions).toBe("be terse");
    expect(capture.body?.temperature).toBe(0.4);
    expect(capture.body?.max_output_tokens).toBe(128);
    expect(capture.body?.text).toEqual({ format: { type: "json_object" } });
    expect(result.text).toBe('{"ok":true}');
    expect(result.metadata?.model).toBe("resolved-model");
  });

  it("lets a request override the model, and throws when none is set", async () => {
    const capture: { body?: Record<string, unknown> } = {};
    const provider = new OpenAIProvider({ client: stub(capture) });

    await provider.generate({ prompt: "x", options: { model: "override" } });
    expect(capture.body?.model).toBe("override");

    await expect(provider.generate({ prompt: "x" })).rejects.toThrow(
      /no model configured/,
    );
  });
});
