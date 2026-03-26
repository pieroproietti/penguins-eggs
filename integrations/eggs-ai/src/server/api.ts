import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { autoDetectProvider } from '../providers/index.js';
import type { LLMProvider } from '../providers/index.js';
import { loadUserConfig } from '../providers/config-loader.js';
import { ProviderRegistry } from '../providers/index.js';
import { runDoctor } from '../agents/doctor.js';
import { runBuild, type BuildOptions } from '../agents/build.js';
import { explainConfig, generateConfig } from '../agents/config.js';
import { runCalamaresAssistant } from '../agents/calamares.js';
import { askQuestion } from '../agents/ask.js';
import { runWardrobeAssistant } from '../agents/wardrobe.js';
import { inspectSystem, formatSystemInfo } from '../tools/system-inspect.js';
import { DaemonClient } from '../bridge/daemon-client.js';

/**
 * HTTP API server for eggs-ai.
 *
 * Designed to run as a sidecar alongside the eggs-gui daemon.
 * All eggs-gui frontends (TUI, Desktop, Web) can call these
 * endpoints to get AI-powered assistance.
 *
 * Endpoints:
 *   POST /api/doctor       — AI diagnostics
 *   POST /api/build        — AI-guided build plan
 *   POST /api/config/explain — Explain current config
 *   POST /api/config/generate — Generate config for a purpose
 *   POST /api/calamares    — Calamares assistant
 *   POST /api/wardrobe     — Wardrobe assistant
 *   POST /api/ask          — General Q&A
 *   POST /api/chat         — Stateful chat (with history)
 *   GET  /api/status       — System status (no AI)
 *   GET  /api/providers    — List available LLM providers
 *   GET  /api/health       — Health check
 */

interface ApiRequest {
  provider?: string;
  model?: string;
  apiKey?: string;
  // Agent-specific fields
  complaint?: string;
  question?: string;
  purpose?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  build?: BuildOptions;
}

// Chat session storage (in-memory, keyed by session ID)
const chatSessions = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>();

function getProvider(req: ApiRequest): LLMProvider {
  if (req.provider) {
    return ProviderRegistry.create({
      provider: req.provider,
      model: req.model,
      apiKey: req.apiKey,
    });
  }
  return autoDetectProvider();
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
  });
}

function json(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function error(res: ServerResponse, status: number, message: string): void {
  json(res, status, { error: message });
}

/**
 * Stream an AI response as Server-Sent Events.
 * If the provider supports chatStream(), tokens arrive in real-time.
 * Otherwise, falls back to sending the full response as a single event.
 */
async function handleSSEStream(
  res: ServerResponse,
  provider: LLMProvider,
  payload: ApiRequest,
  agent: 'ask' | 'doctor' | 'build',
): Promise<void> {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const sendEvent = (event: string, data: string) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Build the messages array for the agent
    const { SYSTEM_PROMPT, EGGS_COMMANDS, EGGS_COMMON_ISSUES, SUPPORTED_DISTROS, CALAMARES_MODULES, WARDROBE_COSTUMES } = await import('../knowledge/eggs-reference.js');
    const { inspectSystem, formatSystemInfo } = await import('../tools/system-inspect.js');

    let messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;

    if (agent === 'ask') {
      const commandList = Object.entries(EGGS_COMMANDS)
        .map(([name, info]) => `  eggs ${name}: ${'description' in info ? (info as { description: string }).description : '(subcommands)'}`)
        .join('\n');
      messages = [
        { role: 'system', content: SYSTEM_PROMPT + '\n\n## Commands\n' + commandList },
        ...(payload.history || []),
        { role: 'user', content: payload.question! },
      ];
    } else if (agent === 'doctor') {
      const info = inspectSystem();
      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `System:\n${formatSystemInfo(info)}\n\n${payload.complaint ? `Problem: ${payload.complaint}` : 'General health check.'}` },
      ];
    } else {
      const info = inspectSystem();
      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `System:\n${formatSystemInfo(info)}\n\nBuild request: ${JSON.stringify(payload.build || {})}` },
      ];
    }

    if (provider.chatStream) {
      // Stream token-by-token
      const full = await provider.chatStream(messages, (chunk) => {
        sendEvent('chunk', chunk);
      });
      sendEvent('done', full);
    } else {
      // Fallback: send full response as one event
      const result = await provider.chat(messages);
      sendEvent('chunk', result);
      sendEvent('done', result);
    }
  } catch (err) {
    sendEvent('error', err instanceof Error ? err.message : String(err));
  }

  res.end();
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url || '/';
  const method = req.method || 'GET';

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  try {
    // ─── GET endpoints ──────────────────────────────────
    if (method === 'GET') {
      switch (url) {
        case '/api/health':
          json(res, 200, { status: 'ok', version: '0.1.0' });
          return;

        case '/api/status': {
          const info = inspectSystem();
          // Also try to get daemon info
          const daemon = new DaemonClient();
          let daemonInfo = null;
          try {
            if (await daemon.isAvailable()) {
              const [versions, deps, isos] = await Promise.all([
                daemon.getVersions(),
                daemon.checkDeps(),
                daemon.listISOs(),
              ]);
              daemonInfo = { versions, deps, isos, connected: true };
            }
          } catch {
            daemonInfo = { connected: false };
          }
          json(res, 200, { system: info, daemon: daemonInfo });
          return;
        }

        case '/api/providers':
          json(res, 200, { providers: ProviderRegistry.listNames() });
          return;

        default:
          error(res, 404, `Unknown endpoint: ${url}`);
          return;
      }
    }

    // ─── POST endpoints ─────────────────────────────────
    if (method !== 'POST') {
      error(res, 405, 'Method not allowed');
      return;
    }

    const body = await readBody(req);
    const payload: ApiRequest = body ? JSON.parse(body) : {};
    const provider = getProvider(payload);

    switch (url) {
      case '/api/doctor': {
        const result = await runDoctor(provider, payload.complaint);
        json(res, 200, { result });
        return;
      }

      case '/api/build': {
        const result = await runBuild(provider, payload.build || {});
        json(res, 200, { result });
        return;
      }

      case '/api/config/explain': {
        const result = await explainConfig(provider);
        json(res, 200, { result });
        return;
      }

      case '/api/config/generate': {
        if (!payload.purpose) {
          error(res, 400, 'Missing "purpose" field');
          return;
        }
        const result = await generateConfig(provider, payload.purpose);
        json(res, 200, { result });
        return;
      }

      case '/api/calamares': {
        const result = await runCalamaresAssistant(provider, payload.question);
        json(res, 200, { result });
        return;
      }

      case '/api/wardrobe': {
        const result = await runWardrobeAssistant(provider, payload.question);
        json(res, 200, { result });
        return;
      }

      case '/api/ask': {
        if (!payload.question) {
          error(res, 400, 'Missing "question" field');
          return;
        }
        const result = await askQuestion(provider, payload.question, payload.history);
        json(res, 200, { result });
        return;
      }

      // ─── SSE streaming endpoints ──────────────────────
      case '/api/stream/ask': {
        if (!payload.question) {
          error(res, 400, 'Missing "question" field');
          return;
        }
        await handleSSEStream(res, provider, payload, 'ask');
        return;
      }

      case '/api/stream/doctor': {
        await handleSSEStream(res, provider, payload, 'doctor');
        return;
      }

      case '/api/stream/build': {
        await handleSSEStream(res, provider, payload, 'build');
        return;
      }

      case '/api/chat': {
        if (!payload.question) {
          error(res, 400, 'Missing "question" field');
          return;
        }
        // Simple session management via a header
        const sessionId = req.headers['x-session-id'] as string || 'default';
        if (!chatSessions.has(sessionId)) {
          chatSessions.set(sessionId, []);
        }
        const history = chatSessions.get(sessionId)!;

        const result = await askQuestion(provider, payload.question, history);

        history.push({ role: 'user', content: payload.question });
        history.push({ role: 'assistant', content: result });

        // Cap history
        if (history.length > 30) {
          history.splice(0, 2);
        }

        json(res, 200, { result, sessionId });
        return;
      }

      default:
        error(res, 404, `Unknown endpoint: ${url}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    error(res, 500, message);
  }
}

export function startServer(port = 3737, host = '127.0.0.1'): void {
  // Load user config for custom providers
  loadUserConfig();

  const server = createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      error(res, 500, err instanceof Error ? err.message : 'Internal error');
    });
  });

  server.listen(port, host, () => {
    console.log(`Eggs-AI API server listening on http://${host}:${port}`);
    console.log(`Providers: ${ProviderRegistry.listNames().join(', ')}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET  /api/health`);
    console.log(`  GET  /api/status`);
    console.log(`  GET  /api/providers`);
    console.log(`  POST /api/doctor`);
    console.log(`  POST /api/build`);
    console.log(`  POST /api/config/explain`);
    console.log(`  POST /api/config/generate`);
    console.log(`  POST /api/calamares`);
    console.log(`  POST /api/wardrobe`);
    console.log(`  POST /api/ask`);
    console.log(`  POST /api/chat`);
  });
}
