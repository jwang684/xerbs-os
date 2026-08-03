import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createAIEngine } from "../bootstrap";
import { createAIConfig } from "../config/AIConfig";
import { StubKnowledgeLoader } from "../knowledge/KnowledgeLoader";
import { BaseModule, ModuleExecutionError } from "../modules/BaseModule";
import type { AIProvider, GenerateRequest } from "../providers/AIProvider";
import { ProviderRegistry } from "../providers/ProviderRegistry";
import { PromptBuilder } from "../prompts/PromptBuilder";
import {
  FileTemplateLoader,
  InMemoryTemplateLoader,
} from "../prompts/TemplateLoader";
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
      new InMemoryTemplateLoader().register("score", template),
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
        new InMemoryTemplateLoader().register(
          "score",
          "symptoms={{knowledge.symptoms}}",
        ),
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
      new InMemoryTemplateLoader().register("t", "{{missing}}"),
    );
    expect(() =>
      builder.build("t", { context: createAIContext() }),
    ).toThrow(/Missing prompt variable/);
  });
});

describe("FileTemplateLoader", () => {
  it("loads placeholder templates from disk and caches them", () => {
    const loader = new FileTemplateLoader();
    const body = loader.load("assessment");
    expect(body).toContain("placeholder");
    // Second read is served from cache (same content).
    expect(loader.load("assessment")).toBe(body);
  });

  it("throws for an unknown template", () => {
    expect(() => new FileTemplateLoader().load("does-not-exist")).toThrow(
      /not found/,
    );
  });
});

describe("AIConfig", () => {
  const config = createAIConfig({
    provider: { default: "openai" },
    defaultModel: { model: "base-model", temperature: 0.2 },
    models: {
      score: { provider: "anthropic", model: "score-model", maxTokens: 500 },
    },
    prompts: { defaultVersion: "v1", versions: { assessment: "v2" } },
  });

  it("merges the keyed model over the default and resolves the provider", () => {
    const m = config.model("score");
    expect(m).toEqual({
      provider: "anthropic",
      model: "score-model",
      temperature: 0.2, // inherited from defaultModel
      maxTokens: 500,
    });
    expect(config.model()?.provider).toBe("openai"); // default provider
    expect(config.provider("score")).toBe("anthropic");
    expect(config.provider("unknown")).toBe("openai");
  });

  it("resolves prompt versions with a default fallback", () => {
    expect(config.promptVersion("assessment")).toBe("v2");
    expect(config.promptVersion("summary")).toBe("v1");
  });

  it("returns undefined / throws when no model is configured", () => {
    const empty = createAIConfig({
      provider: { default: "x" },
      prompts: { defaultVersion: "v1" },
    });
    expect(empty.model("anything")).toBeUndefined();
    expect(() => empty.requireModel("anything")).toThrow(/No model configured/);
  });
});

describe("BaseModule + AIConfig", () => {
  it("drives provider/temperature/model from config keyed by module name", async () => {
    let seen: { temperature?: number; model?: unknown; provider?: string } = {};
    const provider: AIProvider = {
      name: "cfg",
      generate(req) {
        seen = {
          temperature: req.temperature,
          model: req.options?.model,
          provider: "cfg",
        };
        return Promise.resolve({ text: JSON.stringify({ score: 1 }) });
      },
    };
    const services = createDefaultServices({
      prompts: new PromptBuilder(
        new InMemoryTemplateLoader().register("score", "hi"),
      ),
      providers: new ProviderRegistry().register(provider),
      config: createAIConfig({
        provider: { default: "cfg" },
        models: {
          score: { provider: "cfg", model: "score-x", temperature: 0.9 },
        },
        prompts: { defaultVersion: "v1" },
      }),
    });
    await new AIEngine(services).use(new ScoreModule()).run(createAIContext());
    expect(seen).toEqual({ temperature: 0.9, model: "score-x", provider: "cfg" });
  });
});

describe("createAIEngine (bootstrap)", () => {
  it("assembles an engine and registers modules", () => {
    const engine = createAIEngine({ modules: [new ScoreModule()] });
    expect(engine).toBeInstanceOf(AIEngine);
    expect(engine.registered).toEqual(["score"]);
  });

  it("allows overriding services (e.g. providers) for tests", () => {
    const engine = createAIEngine({
      services: { providers: new ProviderRegistry().register(fakeProvider({})) },
    });
    expect(engine.registered).toEqual([]);
  });
});
