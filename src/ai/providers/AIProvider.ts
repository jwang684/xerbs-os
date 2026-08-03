/**
 * A single generation request. `options` is a free-form bag for provider-specific
 * settings (model, temperature, response format, …) so the interface stays
 * vendor-neutral.
 */
export interface GenerateRequest {
  prompt: string;
  system?: string;
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
 * engine and modules depend only on this interface.
 */
export interface AIProvider {
  /** Stable identifier used to register/resolve the provider. */
  readonly name: string;
  generate(request: GenerateRequest): Promise<GenerateResult>;
}
