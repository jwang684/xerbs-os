import { AIConfig, emptyAIConfig } from "./config/AIConfig";
import { AIEngine } from "./engine/AIEngine";
import { StubKnowledgeLoader } from "./knowledge/KnowledgeLoader";
import { AssessmentModule } from "./modules/AssessmentModule";
import type { ExecutableModule, ModuleServices } from "./modules/BaseModule";
import { SummaryModule } from "./modules/SummaryModule";
import { PromptBuilder } from "./prompts/PromptBuilder";
import { FileTemplateLoader } from "./prompts/TemplateLoader";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { ProviderRegistry } from "./providers/ProviderRegistry";
import { SchemaValidator } from "./utils/SchemaValidator";

export interface CreateAIEngineOptions {
  /** Modules to register, in execution order. */
  modules?: ExecutableModule[];
  /** Centralized configuration (model/provider/temperature/tokens/prompt versions). */
  config?: AIConfig;
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
  const config = options.services?.config ?? options.config ?? emptyAIConfig("openai");

  // ── Provider registration (the only place this should happen) ──────────────
  // OpenAI is the initial provider. The SDK stays behind OpenAIProvider; no
  // OpenAI types appear here. The model id comes from the environment (never
  // hardcoded); AIConfig can override it per module. Skipped when providers are
  // injected (tests) or no API key is present.
  if (!options.services?.providers) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      providers.register(
        new OpenAIProvider({ apiKey, model: process.env.OPENAI_MODEL }),
        { default: true },
      );
    }
  }

  const engine = new AIEngine({ providers, prompts, knowledge, validator, config });
  // The pipeline, in runtime-contract order:
  //   Patient Input → Assessment → Summary → (Diagnosis → Formula → Prescription)
  // Only Assessment and Summary are implemented; later modules append here.
  engine.use(...(options.modules ?? [new AssessmentModule(), new SummaryModule()]));
  return engine;
}
