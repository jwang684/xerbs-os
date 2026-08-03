import type { KnowledgeLoader } from "../knowledge/KnowledgeLoader";
import type { PromptBuilder } from "../prompts/PromptBuilder";
import type { ProviderRegistry } from "../providers/ProviderRegistry";
import type { AIContext } from "../types/AIContext";
import type { KnowledgeRequest } from "../types/Knowledge";
import type { Schema, SchemaValidator } from "../utils/SchemaValidator";

/** The shared services the engine injects into every module's `execute`. */
export interface ModuleServices {
  knowledge: KnowledgeLoader;
  prompts: PromptBuilder;
  providers: ProviderRegistry;
  validator: SchemaValidator;
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

  /** Override to declare which knowledge to load; default: reuse context.knowledge. */
  protected knowledgeRequest(context: AIContext): KnowledgeRequest | undefined {
    void context;
    return undefined;
  }

  /** Override to expose extra variables to the prompt template. */
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

    const prompt = services.prompts.build(this.templateKey, {
      context,
      knowledge,
      variables: this.variables(context),
    });

    const provider = services.providers.resolve(this.providerName);
    const response = await provider.generate({
      prompt,
      responseFormat: "json",
      schema: this.outputSchema,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
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
