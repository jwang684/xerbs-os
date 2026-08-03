import { describe, expect, it } from "vitest";
import { z } from "zod";

import { StubKnowledgeLoader } from "../knowledge/KnowledgeLoader";
import { BaseModule, ModuleExecutionError } from "../modules/BaseModule";
import type { AIProvider, GenerateRequest } from "../providers/AIProvider";
import { ProviderRegistry } from "../providers/ProviderRegistry";
import { InMemoryTemplateStore, PromptBuilder } from "../prompts/PromptBuilder";
import { createAIContext } from "../types/AIContext";
import type { KnowledgeRequest } from "../types/Knowledge";
import { SchemaValidator } from "../utils/SchemaValidator";
import { AIEngine, createDefaultServices } from "./AIEngine";

// A provider that echoes a fixed JSON object and records the prompt it saw.
function fakeProvider(
  reply: unknown,
  onPrompt?: (p: string) => void,
): AIProvider {
  return {
    name: "fake",
    generate(req: GenerateRequest) {
      onPrompt?.(req.prompt);
      return Promise.resolve({ text: JSON.stringify(reply) });
    },
  };
}

const resultSchema = z.object({ score: z.number() });

class ScoreModule extends BaseModule<{ score: number }> {
  readonly name = "score";
  protected readonly templateKey = "score";
  protected readonly outputSchema = resultSchema;
  protected knowledgeRequest(): KnowledgeRequest {
    return { symptoms: true };
  }
  protected variables(): Record<string, unknown> {
    return { label: "hello" };
  }
}

function servicesWith(provider: AIProvider, template: string) {
  return createDefaultServices({
    prompts: new PromptBuilder(
      new InMemoryTemplateStore().register({ key: "score", template }),
    ),
    providers: new ProviderRegistry().register(provider),
  });
}

describe("AIEngine", () => {
  it("runs modules and stores results keyed by module name", async () => {
    let seenPrompt = "";
    const services = servicesWith(
      fakeProvider({ score: 7 }, (p) => (seenPrompt = p)),
      "Say {{label}} for {{context.patient.id}}",
    );
    const engine = new AIEngine(services).use(new ScoreModule());
    const ctx = await engine.run(createAIContext({ patient: { id: "p1" } }));

    expect(seenPrompt).toBe("Say hello for p1");
    expect(ctx.results.score).toEqual({ score: 7 });
    expect(engine.registered).toEqual(["score"]);
  });

  it("throws ModuleExecutionError when output fails the schema", async () => {
    const services = servicesWith(fakeProvider({ score: "NaN" }), "x");
    const engine = new AIEngine(services).use(new ScoreModule());
    await expect(engine.run(createAIContext())).rejects.toBeInstanceOf(
      ModuleExecutionError,
    );
  });

  it("loads requested knowledge before building the prompt", async () => {
    const loader = new StubKnowledgeLoader();
    const services = createDefaultServices({
      knowledge: loader,
      prompts: new PromptBuilder(
        new InMemoryTemplateStore().register({
          key: "score",
          template: "symptoms={{knowledge.symptoms}}",
        }),
      ),
      providers: new ProviderRegistry().register(fakeProvider({ score: 1 })),
    });
    const engine = new AIEngine(services).use(new ScoreModule());
    const ctx = await engine.run(createAIContext());
    // Stub returns an empty array for the requested `symptoms` slice.
    expect(ctx.results.score).toEqual({ score: 1 });
  });
});

describe("ProviderRegistry", () => {
  it("resolves by name and defaults to the first registered", () => {
    const a = fakeProvider({});
    const registry = new ProviderRegistry().register({ ...a, name: "a" });
    registry.register({ ...a, name: "b" });
    expect(registry.resolve().name).toBe("a"); // first is default
    expect(registry.resolve("b").name).toBe("b");
    expect(registry.list()).toEqual(["a", "b"]);
  });

  it("throws for an unknown or missing provider", () => {
    expect(() => new ProviderRegistry().resolve()).toThrow();
    expect(() => new ProviderRegistry().resolve("nope")).toThrow();
  });
});

describe("SchemaValidator", () => {
  const v = new SchemaValidator();
  const schema = z.object({ ok: z.boolean() });

  it("validates parsed data and reports issues", () => {
    expect(v.validate(schema, { ok: true })).toEqual({
      success: true,
      data: { ok: true },
    });
    const bad = v.validate(schema, { ok: 1 });
    expect(bad.success).toBe(false);
  });

  it("handles JSON text and rejects malformed JSON", () => {
    expect(v.validateJson(schema, '{"ok":true}').success).toBe(true);
    const bad = v.validateJson(schema, "not json");
    expect(bad).toEqual({
      success: false,
      issues: ["Response was not valid JSON"],
    });
  });
});

describe("PromptBuilder", () => {
  it("throws on a missing template variable", () => {
    const builder = new PromptBuilder(
      new InMemoryTemplateStore().register({ key: "t", template: "{{missing}}" }),
    );
    expect(() =>
      builder.build("t", { context: createAIContext() }),
    ).toThrow(/Missing prompt variable/);
  });
});
