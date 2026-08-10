import type { AIProvider } from "./AIProvider";

/**
 * A registry of AI providers, resolved by name.
 *
 * Keeps provider selection out of the engine and modules: they ask the registry
 * for a provider (by name, or the default) and stay agnostic to which backend is
 * wired in. No provider implementations live here.
 */
export class ProviderRegistry {
  private readonly providers = new Map<string, AIProvider>();
  private defaultName: string | undefined;

  /**
   * Registers a provider. The first one registered becomes the default unless
   * another is explicitly marked (or `setDefault` is called).
   */
  register(provider: AIProvider, options: { default?: boolean } = {}): this {
    this.providers.set(provider.name, provider);
    if (options.default || this.defaultName === undefined) {
      this.defaultName = provider.name;
    }
    return this;
  }

  /** Resolves a provider by name, or the default when `name` is omitted. */
  resolve(name?: string): AIProvider {
    const key = name ?? this.defaultName;
    if (!key) throw new Error("No AI provider registered");
    const provider = this.providers.get(key);
    if (!provider) throw new Error(`AI provider not found: ${key}`);
    return provider;
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }

  list(): string[] {
    return [...this.providers.keys()];
  }

  setDefault(name: string): this {
    if (!this.providers.has(name)) {
      throw new Error(`AI provider not found: ${name}`);
    }
    this.defaultName = name;
    return this;
  }

  get default(): string | undefined {
    return this.defaultName;
  }
}
