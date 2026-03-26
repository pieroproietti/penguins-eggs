import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Integration tests that require the eggs-ai API server running on port 3737.
 * Skipped automatically in CI or when the server isn't reachable.
 *
 * To run locally: start the server first with `npm run serve`
 */

const API = 'http://127.0.0.1:3737';

let serverAvailable = false;

beforeAll(async () => {
  try {
    const resp = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(2000) });
    serverAvailable = resp.ok;
  } catch {
    serverAvailable = false;
  }
});

describe('API Server (requires running server)', () => {
  it('GET /api/health returns ok', async () => {
    if (!serverAvailable) return;
    const resp = await fetch(`${API}/api/health`);
    expect(resp.ok).toBe(true);
    const data = await resp.json() as { status: string; version: string };
    expect(data.status).toBe('ok');
    expect(data.version).toBe('0.1.0');
  });

  it('GET /api/providers returns array', async () => {
    if (!serverAvailable) return;
    const resp = await fetch(`${API}/api/providers`);
    expect(resp.ok).toBe(true);
    const data = await resp.json() as { providers: string[] };
    expect(Array.isArray(data.providers)).toBe(true);
    expect(data.providers).toContain('gemini');
    expect(data.providers).toContain('ollama');
  });

  it('GET /api/status returns system info', async () => {
    if (!serverAvailable) return;
    const resp = await fetch(`${API}/api/status`);
    expect(resp.ok).toBe(true);
    const data = await resp.json() as { system: Record<string, unknown> };
    expect(data.system).toHaveProperty('distro');
    expect(data.system).toHaveProperty('kernel');
    expect(data.system).toHaveProperty('arch');
    expect(data.system).toHaveProperty('eggsInstalled');
  });

  it('GET unknown endpoint returns 404', async () => {
    if (!serverAvailable) return;
    const resp = await fetch(`${API}/api/nonexistent`);
    expect(resp.status).toBe(404);
  });

  it('POST /api/ask without question returns 400', async () => {
    if (!serverAvailable) return;
    const resp = await fetch(`${API}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(resp.status).toBe(400);
    const data = await resp.json() as { error: string };
    expect(data.error).toContain('question');
  });

  it('POST /api/config/generate without purpose returns 400', async () => {
    if (!serverAvailable) return;
    const resp = await fetch(`${API}/api/config/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(resp.status).toBe(400);
    const data = await resp.json() as { error: string };
    expect(data.error).toContain('purpose');
  });

  it('OPTIONS returns CORS headers', async () => {
    if (!serverAvailable) return;
    const resp = await fetch(`${API}/api/health`, {
      method: 'OPTIONS',
    });
    expect(resp.status).toBe(204);
    expect(resp.headers.get('access-control-allow-origin')).toBe('*');
  });
});
