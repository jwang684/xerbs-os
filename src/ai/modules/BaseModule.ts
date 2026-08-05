import type { AIConfig } from "../config/AIConfig";
import type { KnowledgeLoader } from "../knowledge/KnowledgeLoader";
import type { PromptBuilder } from "../prompts/PromptBuilder";
import type { ProviderRegistry } from "../providers/ProviderRegistry";
import type { AIContext } from "../types/AIContext";
import type { KnowledgeBundle, KnowledgeRequest } from "../types/Knowledge";
import type { Schema, SchemaValidator } from "../utils/SchemaValidator";

/** The shared services the engine injects into every module's `execute`. */
export interface ModuleServices {
  knowledge: KnowledgeLoader;
  prompts: PromptBuilder;
  providers: ProviderRegistry;
  validator: SchemaValidator;
  /** Centralized model/provider/temperature/token/prompt-version configuration. */
  config: AIConfig;
}

/** The non-generic view of a module the engine runs. */
export interface ExecutableModule {
  readonly name: string;
  execute(context: AIContext, services: ModuleServices): Promise<unknown>;
}

/** Thrown when a module's provider output fails schema validation. */
export class ModuleExecutionError extends Error {
  constructor(
    moduleName: string,
    readonly issues: string[],
  ) {
    super(`Module "${moduleName}" produced invalid output: ${issues.join("; ")}`);
    this.name = "ModuleExecutionError";
  }
}

/**
 * Base class every AI module inherits from.
 *
 * It implements the shared execution pipeline once (template-method pattern):
 *
 *   load knowledge → build prompt → call provider → validate → finalize
 *
 * so modules stay declarative: they specify a prompt template key, an output
 * schema, and (optionally) which knowledge to load, how to derive extra template
 * variables, and how to shape the validated result. It is provider-independent —
 * the concrete provider is resolved from the injected {@link ProviderRegistry}.
 * No business or medical logic lives here.
 */
export abstract class BaseModule<TOutput> implements ExecutableModule {
  /** Unique module name; also the key under which its result is stored. */
  abstract readonly name: string;

  /** Key of the prompt template this module renders (registered elsewhere). */
  protected abstract readonly templateKey: string;

  /** Schema the provider's output is validated against. */
  protected abstract readonly outputSchema: Schema<TOutput>;

  /** Provider to use; falls back to the registry default when undefined. */
  protected readonly providerName?: string;

  /** Optional generation tunables passed through to the provider. */
  protected readonly temperature?: number;
  protected readonly maxTokens?: number;

  /**
   * The knowledge bundle loaded for the current run. `execute` populates it
   * before `variables()` runs, so a module reads its requested identifiers from
   * here (applying its own graceful fallback) without expanding the `variables`
   * signature. Opaque and immutable; undefined until the first run and whenever
   * no knowledge was requested or supplied.
   */
  protected knowledge?: KnowledgeBundle;

  /** Override to declare which knowledge to load; default: reuse context.knowledge. */
  protected knowledgeRequest(context: AIContext): KnowledgeRequest | undefined {
    void context;
    return undefined;
  }

  /**
   * Override to expose extra variables to the prompt template. A module that
   * requested knowledge reads it from {@link BaseModule.knowledge} (populated by
   * `execute` before this runs) and applies its own graceful fallback (Option B).
   * The signature stays stable on purpose: future internal state is exposed as
   * protected members, never as new `variables` parameters.
   */
  protected variables(context: AIContext): Record<string, unknown> {
    void context;
    return {};
  }

  /** Override to post-process the validated output before it is stored. */
  protected finalize(output: TOutput, context: AIContext): unknown {
    void context;
    return output;
  }

  /** Runs the shared pipeline and returns the finalized result. */
  async execute(context: AIContext, services: ModuleServices): Promise<unknown> {
    const request = this.knowledgeRequest(context);
    const knowledge = request
      ? await services.knowledge.load(request)
      : context.knowledge;
    // Store the loaded bundle on the instance so variables() can read it via
    // this.knowledge without expanding the Template Method signature.
    this.knowledge = knowledge;

    const prompt = services.prompts.build(this.templateKey, {
      context,
      knowledge,
      variables: this.variables(context),
    });

    // Configuration keyed by module name; explicit module fields win over it.
    // Undefined when nothing is configured yet — the engine then falls back to
    // the registry default provider and the module's own tunables.
    const model = services.config.model(this.name);
    const provider = services.providers.resolve(
      this.providerName ?? model?.provider,
    );
    const response = await provider.generate({
      prompt,
      responseFormat: "json",
      schema: this.outputSchema,
      temperature: this.temperature ?? model?.temperature,
      maxTokens: this.maxTokens ?? model?.maxTokens,
      options: model ? { model: model.model } : undefined,
    });

    const result = services.validator.validateJson(
      this.outputSchema,
      response.text,
    );
    if (!result.success) {
      throw new ModuleExecutionError(this.name, result.issues);
    }
    return this.finalize(result.data, context);
  }
}
