import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EggsAiClient } from '../src/sdk/client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

function mockJsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

describe('EggsAiClient', () => {
  const client = new EggsAiClient('http://test:3737', 'test-session');

  it('health() calls GET /api/health', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ status: 'ok' }));
    const result = await client.health();
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('http://test:3737/api/health');
  });

  it('health() returns false on error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const result = await client.health();
    expect(result).toBe(false);
  });

  it('providers() calls GET /api/providers', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ providers: ['gemini', 'ollama'] }));
    const result = await client.providers();
    expect(result).toEqual(['gemini', 'ollama']);
  });

  it('doctor() calls POST /api/doctor', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ result: 'diagnosis text' }));
    const result = await client.doctor('ISO fails');
    expect(result).toBe('diagnosis text');

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('http://test:3737/api/doctor');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.complaint).toBe('ISO fails');
  });

  it('ask() calls POST /api/ask', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ result: 'answer text' }));
    const result = await client.ask('How do I use wardrobe?');
    expect(result).toBe('answer text');
  });

  it('build() sends build options', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ result: 'build plan' }));
    const result = await client.build({ desktop: 'xfce', compression: 'fast' });
    expect(result).toBe('build plan');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.build.desktop).toBe('xfce');
    expect(body.build.compression).toBe('fast');
  });

  it('chat() sends session header', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ result: 'chat reply', sessionId: 'test-session' }));
    const result = await client.chat('hello');
    expect(result).toBe('chat reply');

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers['X-Session-Id']).toBe('test-session');
  });

  it('configGenerate() sends purpose', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ result: 'yaml content' }));
    const result = await client.configGenerate('rescue USB');
    expect(result).toBe('yaml content');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.purpose).toBe('rescue USB');
  });

  it('passes provider override per-request', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ result: 'ok' }));
    await client.ask('test', { provider: 'groq', model: 'llama-3.3-70b' });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.provider).toBe('groq');
    expect(body.model).toBe('llama-3.3-70b');
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'something broke' }),
    });
    await expect(client.ask('test')).rejects.toThrow('something broke');
  });
});
