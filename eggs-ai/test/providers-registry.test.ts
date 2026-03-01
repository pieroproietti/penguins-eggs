import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderRegistry } from '../src/providers/base.js';
import type { LLMProvider, Message } from '../src/providers/base.js';

// Import index to trigger built-in registrations
import '../src/providers/index.js';

function mockProvider(name: string): LLMProvider {
  return {
    name,
    async chat(_msgs: Message[]) { return `mock-${name}-response`; },
    async isAvailable() { return true; },
  };
}

describe('ProviderRegistry', () => {
  it('has built-in providers registered', () => {
    const names = ProviderRegistry.listNames();
    expect(names).toContain('gemini');
    expect(names).toContain('openai');
    expect(names).toContain('ollama');
    expect(names).toContain('anthropic');
    expect(names).toContain('mistral');
    expect(names).toContain('groq');
    expect(names).toContain('custom');
    expect(names).toContain('myclaw');
  });

  it('registers and retrieves a custom provider', () => {
    ProviderRegistry.register('test-provider', () => mockProvider('test'));
    expect(ProviderRegistry.has('test-provider')).toBe(true);
    expect(ProviderRegistry.has('Test-Provider')).toBe(true); // case-insensitive

    const provider = ProviderRegistry.create({ provider: 'test-provider' });
    expect(provider.name).toBe('test');
  });

  it('throws on unknown provider', () => {
    expect(() => ProviderRegistry.create({ provider: 'nonexistent-xyz' }))
      .toThrow(/Unknown provider "nonexistent-xyz"/);
  });

  it('resolves apiKey from envKey', () => {
    process.env.TEST_CUSTOM_KEY = 'secret-123';
    let capturedKey = '';

    ProviderRegistry.register('env-test', (config) => {
      capturedKey = config.apiKey || '';
      return mockProvider('env-test');
    });

    ProviderRegistry.create({ provider: 'env-test', envKey: 'TEST_CUSTOM_KEY' });
    expect(capturedKey).toBe('secret-123');

    delete process.env.TEST_CUSTOM_KEY;
  });

  it('listNames returns sorted array', () => {
    const names = ProviderRegistry.listNames();
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });
});
