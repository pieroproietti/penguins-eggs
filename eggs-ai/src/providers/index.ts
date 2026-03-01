import { ProviderRegistry } from './base.js';
import type { LLMProvider, ProviderConfig } from './base.js';
import { GeminiProvider } from './gemini.js';
import { OllamaProvider } from './ollama.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { MistralProvider } from './mistral.js';
import { GroqProvider } from './groq.js';
import { CustomProvider } from './custom.js';
import { MyclawProvider } from './myclaw.js';

export type { LLMProvider, Message, ProviderConfig, ProviderFactory } from './base.js';
export { ProviderRegistry } from './base.js';

// ─── Register built-in providers ──────────────────────────

ProviderRegistry.register('gemini', (config) => {
  const key = config.apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('API key required. Set GEMINI_API_KEY or pass --api-key.');
  return new GeminiProvider(key, config.model);
});

ProviderRegistry.register('openai', (config) => {
  const key = config.apiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error('API key required. Set OPENAI_API_KEY or pass --api-key.');
  return new OpenAIProvider(key, config.model, config.baseUrl);
});

ProviderRegistry.register('ollama', (config) => {
  return new OllamaProvider(config.model, config.baseUrl);
});

ProviderRegistry.register('anthropic', (config) => {
  const key = config.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('API key required. Set ANTHROPIC_API_KEY or pass --api-key.');
  return new AnthropicProvider(key, config.model, config.baseUrl);
});

ProviderRegistry.register('mistral', (config) => {
  const key = config.apiKey || process.env.MISTRAL_API_KEY;
  if (!key) throw new Error('API key required. Set MISTRAL_API_KEY or pass --api-key.');
  return new MistralProvider(key, config.model, config.baseUrl);
});

ProviderRegistry.register('groq', (config) => {
  const key = config.apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error('API key required. Set GROQ_API_KEY or pass --api-key.');
  return new GroqProvider(key, config.model, config.baseUrl);
});

ProviderRegistry.register('custom', (config) => {
  if (!config.baseUrl) throw new Error('baseUrl is required for custom providers.');
  return new CustomProvider(
    (config.customName as string) || 'custom',
    config.baseUrl,
    config.model || 'default',
    config.apiKey,
  );
});

ProviderRegistry.register('myclaw', (config) => {
  const key = config.apiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error('API key required. Set OPENAI_API_KEY or pass --api-key.');
  return new MyclawProvider(
    key,
    config.model,
    config.baseUrl,
    config.timeoutMs as number | undefined,
    config.retryCount as number | undefined,
  );
});

// ─── Public API ───────────────────────────────────────────

/**
 * Create a provider from config. Uses the registry so any registered
 * provider (built-in or user-added) can be instantiated.
 */
export function createProvider(config: ProviderConfig): LLMProvider {
  return ProviderRegistry.create(config);
}

/**
 * Auto-detect the best available provider from environment variables.
 * Checks keys in order: Gemini, OpenAI, Anthropic, Mistral, Groq, then Ollama.
 */
export function autoDetectProvider(): LLMProvider {
  const checks: Array<{ envVar: string; provider: string }> = [
    { envVar: 'GEMINI_API_KEY', provider: 'gemini' },
    { envVar: 'OPENAI_API_KEY', provider: 'openai' },
    { envVar: 'ANTHROPIC_API_KEY', provider: 'anthropic' },
    { envVar: 'MISTRAL_API_KEY', provider: 'mistral' },
    { envVar: 'GROQ_API_KEY', provider: 'groq' },
  ];

  for (const { envVar, provider } of checks) {
    if (process.env[envVar]) {
      return ProviderRegistry.create({ provider, apiKey: process.env[envVar] });
    }
  }

  // Fall back to local Ollama
  return ProviderRegistry.create({ provider: 'ollama' });
}
