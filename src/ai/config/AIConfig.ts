import type { ModelConfig, ResolvedModel } from "./ModelConfig";
import type { ProviderConfig } from "./ProviderConfig";
import type { PromptConfig } from "./PromptConfig";

/** The full configuration data an {@link AIConfig} wraps. */
export interface AIConfigData {
  provider: ProviderConfig;
  /** Model used when a key has no specific entry. */
  defaultModel?: ModelConfig;
  /** Per-key model overrides, keyed by a logical name (usually a module name). */
  models?: Record<string, ModelConfig>;
  prompts: PromptConfig;
}

/**
 * The single source of truth for AI configuration: model selection, provider
 * selection, temperatures, max tokens, and prompt versions.
 *
 * Modules read their settings from here (keyed by module name) instead of
 * hardcoding them. The framework ships no model names — all values come from the
 * data supplied at construction (typically assembled from env in the bootstrap).
 */
export class AIConfig {
  constructor(private readonly data: AIConfigData) {}

  /**
   * Resolves the model for `key` by merging its override over the default model.
   * Returns undefined when no model id is configured (nothing hardcoded).
   */
  model(key?: string): ResolvedModel | undefined {
    const override = key ? this.data.models?.[key] : undefined;
    const merged: Partial<ModelConfig> = { ...this.data.defaultModel, ...override };
    if (!merged.model) return undefined;
    return {
      provider: merged.provider ?? this.data.provider.default,
      model: merged.model,
      temperature: merged.temperature,
      maxTokens: merged.maxTokens,
    };
  }

  /** Like {@link model}, but throws when nothing is configured for `key`. */
  requireModel(key?: string): ResolvedModel {
    const resolved = this.model(key);
    if (!resolved) {
      throw new Error(`No model configured${key ? ` for "${key}"` : ""}`);
    }
    return resolved;
  }

  /** Provider name for `key`: the model's provider, else the default provider. */
  provider(key?: string): string {
    return this.model(key)?.provider ?? this.data.provider.default;
  }

  temperature(key?: string): number | undefined {
    return this.model(key)?.temperature;
  }

  maxTokens(key?: string): number | undefined {
    return this.model(key)?.maxTokens;
  }

  /** Prompt version for a template name: explicit entry, else the default. */
  promptVersion(name: string): string {
    return this.data.prompts.versions?.[name] ?? this.data.prompts.defaultVersion;
  }

  get defaultProvider(): string {
    return this.data.provider.default;
  }
}

/** Constructs an {@link AIConfig} from explicit data. */
export function createAIConfig(data: AIConfigData): AIConfig {
  return new AIConfig(data);
}

/**
 * An empty configuration: a placeholder default provider, a default prompt
 * version, and NO models. Used until the application supplies real config; it
 * hardcodes no model names.
 */
export function emptyAIConfig(defaultProvider = "default"): AIConfig {
  return new AIConfig({
    provider: { default: defaultProvider },
    prompts: { defaultVersion: "v1" },
  });
}
