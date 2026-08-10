/**
 * Provider-level configuration — vendor-neutral.
 *
 * Centralizes which provider is used by default and optional per-provider
 * default options (a free-form bag mapped internally by each provider). No
 * vendor-specific fields appear here.
 */
export interface ProviderConfig {
  /** Provider name used when a model does not name one. */
  default: string;
  /** Optional default options per provider name (provider maps these itself). */
  options?: Record<string, Record<string, unknown>>;
}
