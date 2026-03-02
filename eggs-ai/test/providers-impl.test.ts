import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OllamaProvider } from '../src/providers/ollama.js';
import { OpenAIProvider } from '../src/providers/openai.js';
import { AnthropicProvider } from '../src/providers/anthropic.js';
import { MistralProvider } from '../src/providers/mistral.js';
import { GroqProvider } from '../src/providers/groq.js';
import { CustomProvider } from '../src/providers/custom.js';
import { MyclawProvider } from '../src/providers/myclaw.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('OllamaProvider', () => {
  it('sends correct request format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: { content: 'ollama response' } }),
    });

    const provider = new OllamaProvider('llama3.2', 'http://localhost:11434');
    const result = await provider.chat([
      { role: 'user', content: 'hello' },
    ]);

    expect(result).toBe('ollama response');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"model":"llama3.2"'),
      }),
    );
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' });
    const provider = new OllamaProvider();
    await expect(provider.chat([{ role: 'user', content: 'hi' }]))
      .rejects.toThrow('Ollama error: 500');
  });

  it('isAvailable checks /api/tags', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const provider = new OllamaProvider();
    expect(await provider.isAvailable()).toBe(true);
  });

  it('isAvailable returns false on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const provider = new OllamaProvider();
    expect(await provider.isAvailable()).toBe(false);
  });
});

describe('OpenAIProvider', () => {
  it('sends correct request with auth header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'openai response' } }] }),
    });

    const provider = new OpenAIProvider('sk-test', 'gpt-4o-mini');
    const result = await provider.chat([
      { role: 'system', content: 'you are helpful' },
      { role: 'user', content: 'hello' },
    ]);

    expect(result).toBe('openai response');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      }),
    );
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'Unauthorized' });
    const provider = new OpenAIProvider('bad-key');
    await expect(provider.chat([{ role: 'user', content: 'hi' }]))
      .rejects.toThrow('OpenAI error: 401');
  });
});

describe('AnthropicProvider', () => {
  it('sends correct Anthropic format with system extraction', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'claude response' }] }),
    });

    const provider = new AnthropicProvider('sk-ant-test');
    const result = await provider.chat([
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'hello' },
    ]);

    expect(result).toBe('claude response');

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.system).toBe('system prompt');
    expect(callBody.messages).toHaveLength(1); // system extracted
    expect(callBody.messages[0].role).toBe('user');
  });

  it('uses x-api-key header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
    });

    const provider = new AnthropicProvider('sk-ant-test');
    await provider.chat([{ role: 'user', content: 'hi' }]);

    expect(mockFetch.mock.calls[0][1].headers).toMatchObject({
      'x-api-key': 'sk-ant-test',
      'anthropic-version': '2023-06-01',
    });
  });
});

describe('MistralProvider', () => {
  it('uses OpenAI-compatible format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'mistral response' } }] }),
    });

    const provider = new MistralProvider('key', 'mistral-large-latest');
    const result = await provider.chat([{ role: 'user', content: 'hello' }]);

    expect(result).toBe('mistral response');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.mistral.ai/v1/chat/completions',
      expect.anything(),
    );
  });
});

describe('GroqProvider', () => {
  it('uses Groq endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'groq response' } }] }),
    });

    const provider = new GroqProvider('key');
    const result = await provider.chat([{ role: 'user', content: 'hello' }]);

    expect(result).toBe('groq response');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.anything(),
    );
  });
});

describe('CustomProvider', () => {
  it('works with arbitrary endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'custom response' } }] }),
    });

    const provider = new CustomProvider('my-llm', 'http://localhost:9999/v1', 'local-model', '');
    const result = await provider.chat([{ role: 'user', content: 'hello' }]);

    expect(result).toBe('custom response');
    expect(provider.name).toBe('my-llm');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:9999/v1/chat/completions',
      expect.anything(),
    );
  });

  it('strips trailing slashes from baseUrl', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    });

    const provider = new CustomProvider('test', 'http://localhost:9999/v1///', 'model');
    await provider.chat([{ role: 'user', content: 'hi' }]);

    expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:9999/v1/chat/completions');
  });

  it('omits Authorization header when no apiKey', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    });

    const provider = new CustomProvider('test', 'http://localhost:9999/v1', 'model', '');
    await provider.chat([{ role: 'user', content: 'hi' }]);

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers).not.toHaveProperty('Authorization');
  });
});

describe('MyclawProvider', () => {
  it('returns plain text when no tool calls', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'myclaw response' } }] }),
    });

    const provider = new MyclawProvider('sk-test', 'gpt-4o-mini');
    const result = await provider.chat([{ role: 'user', content: 'hello' }]);

    expect(result).toBe('myclaw response');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      }),
    );
  });

  it('serializes tool calls as JSON blocks', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: 'Let me check that.',
            tool_calls: [
              {
                id: 'call_1',
                type: 'function',
                function: { name: 'eggs_inspect', arguments: '{}' },
              },
            ],
          },
        }],
      }),
    });

    const provider = new MyclawProvider('sk-test', 'gpt-4o-mini');
    const result = await provider.chat([{ role: 'user', content: 'check system' }]);

    expect(result).toContain('Let me check that.');
    expect(result).toContain('"tool": "eggs_inspect"');
    expect(result).toContain('```json');
  });

  it('handles tool calls without text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: '',
            tool_calls: [
              {
                id: 'call_1',
                type: 'function',
                function: { name: 'eggs_run', arguments: '{"args":"status"}' },
              },
            ],
          },
        }],
      }),
    });

    const provider = new MyclawProvider('sk-test');
    const result = await provider.chat([{ role: 'user', content: 'run status' }]);

    expect(result).toContain('"tool": "eggs_run"');
    expect(result).toContain('"args": "status"');
  });

  it('uses custom baseUrl', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    });

    const provider = new MyclawProvider('sk-test', 'gpt-4o', 'http://localhost:8080/v1');
    await provider.chat([{ role: 'user', content: 'hi' }]);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/v1/chat/completions',
      expect.anything(),
    );
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'Unauthorized' });
    const provider = new MyclawProvider('bad-key');
    await expect(provider.chat([{ role: 'user', content: 'hi' }]))
      .rejects.toThrow('Myclaw provider error: 401');
  });

  it('isAvailable returns false on error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const provider = new MyclawProvider('sk-test');
    expect(await provider.isAvailable()).toBe(false);
  });
});
