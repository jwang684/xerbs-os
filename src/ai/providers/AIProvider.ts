import type { Schema } from "../utils/SchemaValidator";

/** Whether the caller wants free text or a structured JSON response. */
export type ResponseFormat = "text" | "json";

/**
 * A single generation request — vendor-neutral. Providers map these fields onto
 * their own SDKs internally; no OpenAI (or other vendor) options leak through.
 * `options` remains a free-form escape hatch for provider-specific extras.
 */
export interface GenerateRequest {
  prompt: string;
  system?: string;
  /** Desired output form; a provider may enforce JSON mode when `"json"`. */
  responseFormat?: ResponseFormat;
  /** Optional output schema hint a provider MAY use to constrain structured output. */
  schema?: Schema<unknown>;
  temperature?: number;
  maxTokens?: number;
  /** Provider-specific extras (model overrides, etc.). */
  options?: Record<string, unknown>;
}

/** The result of a generation. `text` is the raw model output. */
export interface GenerateResult {
  text: string;
  /** Optional provider metadata (token usage, model id, latency, …). */
  metadata?: Record<string, unknown>;
}

/**
 * The contract every AI backend implements. Deliberately minimal and
 * vendor-neutral — no OpenAI (or any provider) types leak through here, so the
 * engine and modules depend only on this interface. Future providers translate
 * {@link GenerateRequest} into their own request shape.
 */
export interface AIProvider {
  /** Stable identifier used to register/resolve the provider. */
  readonly name: string;
  generate(request: GenerateRequest): Promise<GenerateResult>;
}
