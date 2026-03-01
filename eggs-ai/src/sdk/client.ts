/**
 * Eggs-AI client SDK.
 *
 * Lightweight HTTP client for calling the eggs-ai API server.
 * Designed for use in eggs-gui frontends (NodeGUI desktop, NiceGUI web, etc.)
 *
 * Usage in eggs-gui desktop (TypeScript):
 *
 *   import { EggsAiClient } from 'eggs-ai/sdk';
 *
 *   const ai = new EggsAiClient();  // defaults to http://127.0.0.1:3737
 *
 *   const diagnosis = await ai.doctor('ISO boots to black screen');
 *   const plan = await ai.build({ desktop: 'xfce', compression: 'fast' });
 *   const answer = await ai.ask('How do I use wardrobe?');
 *
 * Usage in eggs-gui web (Python) — call the same HTTP endpoints:
 *
 *   import httpx
 *   resp = httpx.post('http://127.0.0.1:3737/api/ask', json={'question': '...'})
 */

export interface AiResponse {
  result: string;
}

export interface StatusResponse {
  system: {
    distro: string;
    kernel: string;
    arch: string;
    hostname: string;
    diskSpace: string;
    memoryMb: number;
    eggsInstalled: boolean;
    eggsVersion: string | null;
    eggsConfigExists: boolean;
    calamaresInstalled: boolean;
    nodeVersion: string;
    initSystem: string;
  };
  daemon: {
    connected: boolean;
    versions?: { eggs: string; calamares: string; distro: string; kernel: string };
    deps?: { eggsInstalled: boolean; calamaresInstalled: boolean; configExists: boolean };
    isos?: Array<{ path: string; name: string; size: number; modified: string }>;
  } | null;
}

export interface ProvidersResponse {
  providers: string[];
}

export interface ChatResponse {
  result: string;
  sessionId: string;
}

export interface BuildOptions {
  desktop?: string;
  installer?: 'calamares' | 'krill' | 'none';
  compression?: 'fast' | 'standard' | 'max';
  prefix?: string;
  basename?: string;
  clone?: boolean;
  release?: boolean;
  dryRun?: boolean;
  description?: string;
}

export interface RequestOptions {
  /** Override the LLM provider for this request */
  provider?: string;
  /** Override the model for this request */
  model?: string;
}

export class EggsAiClient {
  private baseUrl: string;
  private sessionId: string;

  constructor(baseUrl = 'http://127.0.0.1:3737', sessionId?: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.sessionId = sessionId || `session-${Date.now()}`;
  }

  private async post<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': this.sessionId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json() as { error: string };
      throw new Error(`Eggs-AI error: ${err.error}`);
    }

    return response.json() as Promise<T>;
  }

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      const err = await response.json() as { error: string };
      throw new Error(`Eggs-AI error: ${err.error}`);
    }
    return response.json() as Promise<T>;
  }

  // ─── AI endpoints ───────────────────────────────────────

  /** Run AI diagnostics on the system. */
  async doctor(complaint?: string, opts?: RequestOptions): Promise<string> {
    const res = await this.post<AiResponse>('/api/doctor', {
      complaint,
      ...opts,
    });
    return res.result;
  }

  /** Get an AI-guided build plan. */
  async build(options?: BuildOptions, opts?: RequestOptions): Promise<string> {
    const res = await this.post<AiResponse>('/api/build', {
      build: options,
      ...opts,
    });
    return res.result;
  }

  /** Explain the current eggs.yaml config. */
  async configExplain(opts?: RequestOptions): Promise<string> {
    const res = await this.post<AiResponse>('/api/config/explain', { ...opts });
    return res.result;
  }

  /** Generate an eggs.yaml for a specific purpose. */
  async configGenerate(purpose: string, opts?: RequestOptions): Promise<string> {
    const res = await this.post<AiResponse>('/api/config/generate', {
      purpose,
      ...opts,
    });
    return res.result;
  }

  /** Get Calamares assistance. */
  async calamares(question?: string, opts?: RequestOptions): Promise<string> {
    const res = await this.post<AiResponse>('/api/calamares', {
      question,
      ...opts,
    });
    return res.result;
  }

  /** Get wardrobe/costume assistance. */
  async wardrobe(question?: string, opts?: RequestOptions): Promise<string> {
    const res = await this.post<AiResponse>('/api/wardrobe', {
      question,
      ...opts,
    });
    return res.result;
  }

  /** Ask any question about penguins-eggs. */
  async ask(question: string, opts?: RequestOptions): Promise<string> {
    const res = await this.post<AiResponse>('/api/ask', {
      question,
      ...opts,
    });
    return res.result;
  }

  /** Stateful chat — maintains conversation history server-side. */
  async chat(question: string, opts?: RequestOptions): Promise<string> {
    const res = await this.post<ChatResponse>('/api/chat', {
      question,
      ...opts,
    });
    return res.result;
  }

  // ─── Streaming endpoints (SSE) ───────────────────────────

  /**
   * Stream an AI response token-by-token via Server-Sent Events.
   * @param onChunk Called for each token as it arrives
   * @param onDone Called with the full response when complete
   */
  async streamAsk(
    question: string,
    onChunk: (chunk: string) => void,
    onDone?: (full: string) => void,
    opts?: RequestOptions,
  ): Promise<string> {
    return this.consumeSSE('/api/stream/ask', { question, ...opts }, onChunk, onDone);
  }

  async streamDoctor(
    complaint: string | undefined,
    onChunk: (chunk: string) => void,
    onDone?: (full: string) => void,
    opts?: RequestOptions,
  ): Promise<string> {
    return this.consumeSSE('/api/stream/doctor', { complaint, ...opts }, onChunk, onDone);
  }

  async streamBuild(
    options: BuildOptions | undefined,
    onChunk: (chunk: string) => void,
    onDone?: (full: string) => void,
    opts?: RequestOptions,
  ): Promise<string> {
    return this.consumeSSE('/api/stream/build', { build: options, ...opts }, onChunk, onDone);
  }

  private async consumeSSE(
    path: string,
    body: Record<string, unknown>,
    onChunk: (chunk: string) => void,
    onDone?: (full: string) => void,
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': this.sessionId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json() as { error: string };
      throw new Error(`Eggs-AI stream error: ${err.error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6)) as string;
          if (currentEvent === 'chunk') {
            onChunk(data);
          } else if (currentEvent === 'done') {
            fullResponse = data;
            onDone?.(data);
          } else if (currentEvent === 'error') {
            throw new Error(data);
          }
        }
      }
    }

    return fullResponse;
  }

  // ─── Info endpoints ─────────────────────────────────────

  /** Get system status and daemon connection info. */
  async status(): Promise<StatusResponse> {
    return this.get<StatusResponse>('/api/status');
  }

  /** List available LLM providers. */
  async providers(): Promise<string[]> {
    const res = await this.get<ProvidersResponse>('/api/providers');
    return res.providers;
  }

  /** Health check. */
  async health(): Promise<boolean> {
    try {
      await this.get('/api/health');
      return true;
    } catch {
      return false;
    }
  }
}
