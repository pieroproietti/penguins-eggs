# src/ — Module Reference

## Data flow

Every user interaction follows the same pattern:

```
Input → Agent → Knowledge + System Inspect → LLM Provider → Response
```

The three entry points (CLI, HTTP API, MCP) all converge on the same agents and knowledge.

**Exception:** MCP tools skip the LLM entirely. They return knowledge directly to the calling AI agent, which acts as the LLM.

## Modules

### agents/

Six async functions, one per domain. Each constructs a prompt from knowledge + system state, calls `provider.chat()`, and returns the LLM's response as a string.

No agent calls another agent. No agent calls the API server. They are pure functions of `(provider, args) → string`.

| Agent | Unique context it adds to the prompt |
|-------|--------------------------------------|
| `doctor` | System info + eggs config + full issues database |
| `build` | System info + build options + produce flags reference |
| `config` | Current eggs.yaml content + config field reference |
| `calamares` | Calamares config files from disk + module reference |
| `wardrobe` | Wardrobe repository info + costume examples |
| `ask` | Full knowledge base + distro guides + dynamic GitHub data |

### providers/

The `LLMProvider` interface has two required methods (`chat`, `isAvailable`) and one optional (`chatStream`).

`ProviderRegistry` is a global singleton. Built-in providers register themselves when `providers/index.ts` is imported. User-defined providers register via `config-loader.ts` (reads `~/.eggs-ai.yaml`).

Provider resolution order: CLI `--provider` flag → config file `default_provider` → env var auto-detection → Ollama fallback.

### knowledge/

Static data embedded in the binary. No filesystem reads, no network calls (except `updater.ts`).

- `eggs-reference.ts` — the core reference: all commands, config fields, common issues, supported distros, calamares modules, wardrobe info, and the system prompt
- `distro-guides.ts` — per-distro install instructions, advanced workflow guides, additional troubleshooting
- `updater.ts` — fetches recent issues, latest release, and README from GitHub. Caches at `~/.cache/eggs-ai/` with 24h TTL. Only used by the `ask` agent (appended to its context when available).

### server/

Single-file HTTP server using Node's built-in `http` module. No Express, no framework.

Handles CORS, JSON parsing, error responses. Each endpoint maps to an agent function call. SSE streaming endpoints use `chatStream()` when the provider supports it, falling back to a single `chunk` + `done` event.

Chat sessions are stored in-memory (keyed by `X-Session-Id` header). They don't persist across restarts.

### mcp/

Standalone MCP server over stdio. Reads JSON-RPC lines from stdin, writes responses to stdout.

10 tools that return knowledge directly — no LLM calls. The calling AI agent (Cursor, Claude Desktop, opencode) provides the reasoning. This makes MCP tools fast and free (no API key needed).

The MCP server imports knowledge modules but not agents or providers.

### bridge/

Integration layer for the eggs-gui daemon:

- `daemon-client.ts` — JSON-RPC client that connects to the daemon's Unix socket (`/tmp/eggs-gui.sock`). Used by the API server's `/api/status` endpoint to include daemon state.
- `rpc-methods.ts` — `ai.*` method handlers that can be registered with the daemon. Maps method names to agent calls.

### sdk/

`EggsAiClient` — a fetch-based HTTP client for the API server. Designed for import by eggs-gui's TypeScript desktop frontend. Also includes SSE streaming methods.

Exported as `eggs-ai/sdk` via package.json `exports`.

### tools/

- `system-inspect.ts` — reads `/etc/os-release`, `uname`, `df`, `/proc/meminfo`, checks for eggs/calamares binaries, reads eggs config. All via `execSync` with timeouts.
- `eggs-cli.ts` — wrapper for running `eggs` commands with output capture. Used by agents that need live eggs output (not currently called by any agent, available for future use).

## Key design decisions

**Why no framework for the HTTP server?** The API is 14 endpoints with simple JSON. Node's `http` module is sufficient and avoids a dependency.

**Why are MCP tools separate from agents?** Agents need an LLM to reason. MCP tools are called *by* an LLM. Mixing them would create circular dependencies and require an API key for MCP to work.

**Why is knowledge static?** Reliability. The agent works offline, on air-gapped systems, and without GitHub access. Dynamic updates are additive — they enrich the `ask` agent but aren't required.

**Why does each provider implement `chat()` separately instead of sharing a base class?** Each API has different auth headers, request formats, and response shapes. Anthropic uses `x-api-key` + `system` field extraction. Gemini uses a completely different SDK. Sharing a base class would add complexity without reducing code.
