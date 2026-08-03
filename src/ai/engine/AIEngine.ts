import { StubKnowledgeLoader } from "../knowledge/KnowledgeLoader";
import type { ExecutableModule, ModuleServices } from "../modules/BaseModule";
import { InMemoryTemplateStore, PromptBuilder } from "../prompts/PromptBuilder";
import { ProviderRegistry } from "../providers/ProviderRegistry";
import type { AIContext } from "../types/AIContext";
import { SchemaValidator } from "../utils/SchemaValidator";

/**
 * Builds a default set of module services (empty provider registry, stub
 * knowledge loader, empty template store, validator). Any piece can be
 * overridden — this is the wiring point for real providers/knowledge/templates.
 */
export function createDefaultServices(
  overrides: Partial<ModuleServices> = {},
): ModuleServices {
  return {
    knowledge: overrides.knowledge ?? new StubKnowledgeLoader(),
    prompts: overrides.prompts ?? new PromptBuilder(new InMemoryTemplateStore()),
    providers: overrides.providers ?? new ProviderRegistry(),
    validator: overrides.validator ?? new SchemaValidator(),
  };
}

/**
 * Orchestrates AI modules.
 *
 * The engine owns the shared services and runs registered modules sequentially
 * over a single {@link AIContext}, storing each module's output in
 * `context.results` (keyed by module name) so later modules can read earlier
 * results. It defines orchestration only — the per-module pipeline (knowledge →
 * prompt → provider → validation) lives in {@link BaseModule}, and no real AI
 * calls or business logic live here.
 */
export class AIEngine {
  private readonly modules: ExecutableModule[] = [];

  constructor(
    private readonly services: ModuleServices = createDefaultServices(),
  ) {}

  /** Registers a module to run. */
  register(module: ExecutableModule): this {
    this.modules.push(module);
    return this;
  }

  /** Registers several modules, in order. */
  use(...modules: ExecutableModule[]): this {
    this.modules.push(...modules);
    return this;
  }

  /** Runs all modules sequentially, storing each result on the context. */
  async run(context: AIContext): Promise<AIContext> {
    for (const mod of this.modules) {
      context.results[mod.name] = await mod.execute(context, this.services);
    }
    return context;
  }

  /** Names of the registered modules, in execution order. */
  get registered(): string[] {
    return this.modules.map((m) => m.name);
  }
}
