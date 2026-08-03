/**
 * A model selection plus generation defaults — provider-independent.
 *
 * `model` is a provider-specific identifier that is ALWAYS supplied by
 * application configuration (env / config data); the framework never hardcodes
 * model names. `provider` is optional and falls back to the configured default
 * provider when omitted.
 */
export interface ModelConfig {
  /** Registered provider name; falls back to {@link ProviderConfig.default}. */
  provider?: string;
  /** Provider-specific model id (supplied by app config, never hardcoded here). */
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/** A {@link ModelConfig} with the provider resolved to a concrete name. */
export interface ResolvedModel {
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}
