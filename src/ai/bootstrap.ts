import { AIEngine } from "./engine/AIEngine";
import { StubKnowledgeLoader } from "./knowledge/KnowledgeLoader";
import type { ExecutableModule, ModuleServices } from "./modules/BaseModule";
import { PromptBuilder } from "./prompts/PromptBuilder";
import { FileTemplateLoader } from "./prompts/TemplateLoader";
import { ProviderRegistry } from "./providers/ProviderRegistry";
import { SchemaValidator } from "./utils/SchemaValidator";

export interface CreateAIEngineOptions {
  /** Modules to register, in execution order. */
  modules?: ExecutableModule[];
  /** Override individual services (mainly for tests). */
  services?: Partial<ModuleServices>;
}

/**
 * The single assembly point for the AI framework.
 *
 * It constructs every framework service — {@link ProviderRegistry},
 * {@link PromptBuilder} (filesystem-backed), {@link StubKnowledgeLoader},
 * {@link SchemaValidator} — wires them into an {@link AIEngine}, and is the ONLY
 * place providers should be registered. Application code calls `createAIEngine()`
 * and never instantiates framework services directly.
 *
 * No providers are registered yet (framework-only phase); the marked block below
 * is where they will go.
 */
export function createAIEngine(options: CreateAIEngineOptions = {}): AIEngine {
  const providers = options.services?.providers ?? new ProviderRegistry();
  const prompts =
    options.services?.prompts ?? new PromptBuilder(new FileTemplateLoader());
  const knowledge = options.services?.knowledge ?? new StubKnowledgeLoader();
  const validator = options.services?.validator ?? new SchemaValidator();

  // ── Provider registration (the only place this should happen) ──────────────
  // e.g. providers.register(new OpenAIProvider(env.OPENAI_API_KEY), { default: true });
  // Intentionally empty during the framework-only phase.

  const engine = new AIEngine({ providers, prompts, knowledge, validator });
  if (options.modules) engine.use(...options.modules);
  return engine;
}
