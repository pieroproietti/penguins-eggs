# Contributing to Eggs-AI

## Quick start

```bash
git clone https://github.com/Interested-Deving-1896/eggs-ai.git
cd eggs-ai
npm install
npm run build
npm test          # 80 tests, should all pass
npm run dev -- status   # verify CLI works
```

Node.js 18+ required. No LLM key needed for development — tests use mocks.

## Project layout

```
src/
├── agents/        # 6 domain agents — each takes an LLMProvider + args, returns a string
├── providers/     # LLM abstraction — registry, 7 built-in providers, config loader
├── knowledge/     # Static + dynamic domain knowledge (commands, issues, distro guides)
├── server/        # HTTP API server (REST + SSE streaming)
├── mcp/           # Model Context Protocol server (stdio JSON-RPC)
├── bridge/        # eggs-gui daemon client + JSON-RPC method definitions
├── sdk/           # TypeScript client SDK for the HTTP API
├── tools/         # System inspection and eggs CLI wrappers
└── index.ts       # CLI entry point (Commander)

test/              # Vitest tests — unit, integration, E2E, MCP
integrations/      # Drop-in code for eggs-gui frontends (Python, Go)
examples/          # Sample configs and programmatic usage
packaging/         # systemd service, .desktop file
proto/             # JSON-RPC schema for eggs-gui integration
```

## Development workflow

### Build and test

```bash
npm run build      # TypeScript → dist/
npm test           # Run all tests once
npm run test:watch # Watch mode
npm run dev -- <command>  # Run CLI without building (uses tsx)
```

### Run the API server

```bash
npm run serve      # Starts on http://127.0.0.1:3737
# or
npm run dev -- serve --port 3737
```

### Run the MCP server

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npx tsx src/mcp/server.ts
```

## How things connect

```
User input
    │
    ▼
CLI (src/index.ts)  ──or──  API Server (src/server/api.ts)  ──or──  MCP Server (src/mcp/server.ts)
    │                              │                                       │
    ▼                              ▼                                       ▼
Agent (src/agents/*.ts)      Agent (same)                          Direct knowledge lookup
    │                              │                               (no LLM needed for MCP)
    ├── Knowledge (src/knowledge/) │
    ├── System inspect (src/tools/)│
    │                              │
    ▼                              ▼
LLMProvider.chat(messages)   LLMProvider.chat(messages)
    │                              │
    ▼                              ▼
ProviderRegistry → Gemini / OpenAI / Anthropic / Ollama / ...
```

Key distinction: **agents** need an LLM provider (they construct prompts and call `provider.chat()`). **MCP tools** return knowledge directly without an LLM — the calling AI agent (Cursor, Claude Desktop, etc.) is the LLM.

## Adding a new LLM provider

1. Create `src/providers/myservice.ts`:

```typescript
import type { LLMProvider, Message } from './base.js';

export class MyServiceProvider implements LLMProvider {
  name = 'myservice';

  constructor(private apiKey: string, private model = 'default-model') {}

  async chat(messages: Message[]): Promise<string> {
    // Call your API, return the response text
  }

  // Optional: streaming support
  async chatStream?(messages: Message[], onChunk: (chunk: string) => void): Promise<string> {
    // Stream tokens, call onChunk for each, return full text
  }

  async isAvailable(): Promise<boolean> {
    // Quick check — can we reach the API?
  }
}
```

2. Register it in `src/providers/index.ts`:

```typescript
import { MyServiceProvider } from './myservice.js';

ProviderRegistry.register('myservice', (config) => {
  const key = config.apiKey || process.env.MYSERVICE_API_KEY;
  if (!key) throw new Error('API key required. Set MYSERVICE_API_KEY.');
  return new MyServiceProvider(key, config.model);
});
```

3. Add it to the auto-detection list in `autoDetectProvider()` if it has an env var.

4. Add tests in `test/providers-impl.test.ts` — mock `fetch`, verify request format and headers.

If the API is OpenAI-compatible (most are), you can skip step 1 and just register it with the `CustomProvider`:

```typescript
ProviderRegistry.register('myservice', (config) => {
  return new CustomProvider('myservice', 'https://api.myservice.com/v1', config.model || 'default', config.apiKey);
});
```

## Adding a new agent

Agents live in `src/agents/`. Each one:
- Takes an `LLMProvider` and agent-specific arguments
- Builds a prompt using knowledge from `src/knowledge/`
- Calls `provider.chat(messages)` and returns the result

1. Create `src/agents/myagent.ts`:

```typescript
import type { LLMProvider, Message } from '../providers/index.js';
import { SYSTEM_PROMPT } from '../knowledge/eggs-reference.js';
import { inspectSystem, formatSystemInfo } from '../tools/system-inspect.js';

export async function runMyAgent(provider: LLMProvider, userInput: string): Promise<string> {
  const systemInfo = inspectSystem();

  const prompt = `
## System
${formatSystemInfo(systemInfo)}

## Task
${userInput}

Provide specific, actionable output.
`;

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];

  return provider.chat(messages);
}
```

2. Wire it into the CLI in `src/index.ts` — add a new Commander command.

3. Wire it into the API server in `src/server/api.ts` — add a new endpoint.

4. Add tests in `test/agents.test.ts` — use a mock provider, verify the prompt contains the right context.

## Adding a new MCP tool

MCP tools in `src/mcp/server.ts` return knowledge directly — no LLM call. They're for other AI agents to use.

1. Add the tool definition to the `TOOLS` array:

```typescript
{
  name: 'eggs_my_tool',
  description: 'What this tool does (be specific — the AI agent reads this)',
  inputSchema: {
    type: 'object',
    properties: {
      param: { type: 'string', description: 'What this param is for' },
    },
    required: ['param'],
  },
},
```

2. Add a handler case in `handleTool()`:

```typescript
case 'eggs_my_tool': {
  const param = args.param as string;
  // Look up knowledge, inspect system, etc.
  return text(`Result for ${param}`);
}
```

3. Add tests in `test/mcp-server.test.ts` — send a JSON-RPC request, verify the response.

## Adding knowledge

### Static knowledge (src/knowledge/)

- `eggs-reference.ts` — commands, config fields, common issues, supported distros, calamares modules, wardrobe costumes, system prompt
- `distro-guides.ts` — per-distro install guides, advanced workflows, additional troubleshooting

Add new entries to the existing data structures. The agents and MCP tools reference these at runtime.

### Dynamic knowledge (src/knowledge/updater.ts)

Fetches from GitHub API and caches locally:
- Recent issues (20 most recent)
- Latest release info
- README excerpt

Cache lives at `~/.cache/eggs-ai/` with a 24-hour TTL. Run `eggs-ai update` to refresh manually.

## Testing

### Test structure

| File | What it tests |
|------|--------------|
| `providers-registry.test.ts` | Registry registration, lookup, env key resolution |
| `providers-impl.test.ts` | All 6 provider implementations (mocked fetch) |
| `agents.test.ts` | All 5 agents with mock providers |
| `knowledge.test.ts` | Knowledge base structure validation |
| `system-inspect.test.ts` | System detection on live system |
| `sdk-client.test.ts` | SDK client with mocked HTTP |
| `api-server.test.ts` | Integration tests against running API server |
| `mcp-server.test.ts` | MCP protocol tests via subprocess |
| `e2e.test.ts` | Full pipeline validation (prompt construction, history, error handling) |

### Writing tests

- Use `vitest` (already configured)
- Mock `fetch` with `vi.stubGlobal('fetch', mockFetch)` for provider tests
- Use `createMockProvider()` pattern for agent tests — captures messages sent to the LLM
- MCP tests shell out to `npx tsx src/mcp/server.ts` with JSON-RPC input
- API tests hit `http://127.0.0.1:3737` (requires the server to be running)

### Running specific tests

```bash
npx vitest run test/agents.test.ts
npx vitest run -t "doctor agent"     # by test name
```

## Code conventions

- TypeScript strict mode, ES2022 target, Node16 module resolution
- ESM only (`"type": "module"` in package.json)
- Imports use `.js` extension (required for Node ESM)
- No classes for agents — plain async functions
- Classes for providers (they hold state: API keys, model names)
- `ProviderRegistry` is a singleton — register once, use everywhere
- Knowledge is exported as plain objects/arrays, not classes

## Pull request guidelines

1. Branch from `master`
2. Run `npm test` — all tests must pass
3. Run `npm run build` — must compile clean
4. Add tests for new functionality
5. Keep commits focused — one logical change per commit
6. Commit message format: short summary line, blank line, details if needed

## Deployment options

| Method | Command |
|--------|---------|
| CLI | `npm run dev -- <command>` |
| API server | `eggs-ai serve --port 3737` |
| MCP server | `eggs-ai mcp` (stdio) |
| Docker | `docker compose up -d` |
| systemd | `sudo cp packaging/eggs-ai.service /etc/systemd/system/ && sudo systemctl enable --now eggs-ai` |
| Install script | `sudo bash install.sh` |
