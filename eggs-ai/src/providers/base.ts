export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMProvider {
  name: string;
  chat(messages: Message[]): Promise<string>;
  /** Stream response token-by-token. Falls back to chat() if not implemented. */
  chatStream?(messages: Message[], onChunk: (chunk: string) => void): Promise<string>;
  isAvailable(): Promise<boolean>;
}

export interface ProviderConfig {
  provider: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  /** Environment variable name to read the API key from */
  envKey?: string;
  /** Arbitrary extra options passed to the provider factory */
  [key: string]: unknown;
}

/**
 * Factory function that creates an LLMProvider from a config.
 * Custom providers implement this to plug into the registry.
 */
export type ProviderFactory = (config: ProviderConfig) => LLMProvider;

/**
 * Global provider registry. Providers register by name and can be
 * looked up at runtime. Open to third-party and user-defined providers.
 */
class ProviderRegistryImpl {
  private factories = new Map<string, ProviderFactory>();

  /** Register a provider factory under a name. */
  register(name: string, factory: ProviderFactory): void {
    this.factories.set(name.toLowerCase(), factory);
  }

  /** Check if a provider is registered. */
  has(name: string): boolean {
    return this.factories.has(name.toLowerCase());
  }

  /** Create a provider instance by name. */
  create(config: ProviderConfig): LLMProvider {
    const name = config.provider.toLowerCase();
    const factory = this.factories.get(name);
    if (!factory) {
      const available = this.listNames().join(', ');
      throw new Error(
        `Unknown provider "${config.provider}". Available: ${available}`,
      );
    }
    // Resolve API key from envKey if apiKey not set directly
    if (!config.apiKey && config.envKey) {
      config.apiKey = process.env[config.envKey];
    }
    return factory(config);
  }

  /** List all registered provider names. */
  listNames(): string[] {
    return [...this.factories.keys()].sort();
  }
}

export const ProviderRegistry = new ProviderRegistryImpl();
