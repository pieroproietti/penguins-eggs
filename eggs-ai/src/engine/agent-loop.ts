/**
 * Multi-step agentic execution loop for eggs-ai.
 *
 * Adapted from myclaw's agent loop. The agent uses tools iteratively —
 * inspect system, read configs, run eggs commands, query knowledge —
 * until it produces a final text answer or hits maxSteps.
 */

import type { LLMProvider, Message } from '../providers/index.js';
import { SYSTEM_PROMPT } from '../knowledge/eggs-reference.js';
import type { EventBus } from './event-bus.js';
import type { AgentSession } from './session-store.js';
import { SessionStore, compressContext } from './session-store.js';
import { executeTool } from './tool-executor.js';
import { ALL_TOOLS, type ToolDefinition } from './tool-definitions.js';

export type AgentEvent =
  | { type: 'start'; sessionId: string; step: number }
  | { type: 'tool_call'; sessionId: string; step: number; tool: string; input: Record<string, unknown> }
  | { type: 'tool_result'; sessionId: string; step: number; tool: string; ok: boolean; output: string }
  | { type: 'thinking'; sessionId: string; step: number; content: string }
  | { type: 'final'; sessionId: string; step: number; content: string }
  | { type: 'max_steps'; sessionId: string; step: number }
  | { type: 'error'; sessionId: string; step: number; error: string }
  | { type: 'summary'; sessionId: string; from: number; to: number; content: string }
  | { type: 'session_end'; sessionId: string };

export interface AgentLoopOptions {
  maxSteps?: number;
  bus?: EventBus<AgentEvent>;
  onEvent?: (event: AgentEvent) => void;
  tools?: ToolDefinition[];
  session?: AgentSession;
  systemPrompt?: string;
  contextWindowSize?: number;
}

const sessionStore = new SessionStore();

function emit(options: AgentLoopOptions, event: AgentEvent): void {
  options.onEvent?.(event);
  options.bus?.publish(event);
}

function buildToolPrompt(tools: ToolDefinition[]): string {
  const descs = tools.map((t) => {
    const params = Object.entries(t.inputSchema.properties)
      .map(([n, s]) => `    ${n}: ${s.type}${s.description ? ` — ${s.description}` : ''}`)
      .join('\n');
    return `- ${t.name}: ${t.description}\n  Parameters:\n${params}`;
  }).join('\n\n');

  return `\n## Available Tools\n\nCall tools by responding with a JSON block:\n\`\`\`json\n{"tool": "<name>", "input": {<params>}}\n\`\`\`\n\nWhen you have enough information, respond with plain text (no JSON tool call).\n\n${descs}\n`;
}

function parseToolCalls(text: string): Array<{ tool: string; input: Record<string, unknown> }> {
  const calls: Array<{ tool: string; input: Record<string, unknown> }> = [];

  for (const match of text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) {
    try {
      const p = JSON.parse(match[1].trim());
      if (typeof p.tool === 'string' && p.input && typeof p.input === 'object') calls.push({ tool: p.tool, input: p.input });
    } catch { /* skip */ }
  }
  if (calls.length > 0) return calls;

  for (const match of text.matchAll(/\{[^{}]*"tool"\s*:\s*"[^"]+"\s*,\s*"input"\s*:\s*\{[^}]*\}[^}]*\}/g)) {
    try {
      const p = JSON.parse(match[0]);
      if (typeof p.tool === 'string' && p.input && typeof p.input === 'object') calls.push({ tool: p.tool, input: p.input });
    } catch { /* skip */ }
  }
  return calls;
}

export async function runAgentLoop(provider: LLMProvider, task: string, options: AgentLoopOptions = {}): Promise<string> {
  const maxSteps = options.maxSteps ?? 10;
  const tools = options.tools ?? ALL_TOOLS;
  const contextWindowSize = options.contextWindowSize ?? 20;
  const session = options.session ?? sessionStore.create();
  const sessionId = session.id;

  const basePrompt = options.systemPrompt ?? SYSTEM_PROMPT;
  const fullSystemPrompt = basePrompt + '\n' + buildToolPrompt(tools);

  if (session.messages.length === 0) {
    session.messages.push({ role: 'system', content: fullSystemPrompt });
  }
  session.messages.push({ role: 'user', content: task });
  await sessionStore.log(sessionId, { type: 'message', role: 'user', content: task });
  emit(options, { type: 'start', sessionId, step: 0 });

  for (let step = 1; step <= maxSteps; step++) {
    const summaries = compressContext(session);
    for (const s of summaries) emit(options, { type: 'summary', sessionId, from: s.from, to: s.to, content: s.content });

    const systemMsg = session.messages.find((m) => m.role === 'system');
    const nonSystem = session.messages.filter((m) => m.role !== 'system');
    const recent = nonSystem.slice(-contextWindowSize);
    const summaryCtx = session.summaries.length > 0
      ? '\n\n## Previous Context (summaries)\n' + session.summaries.slice(-3).map((s) => s.content).join('\n---\n')
      : '';
    const ctx: Message[] = [
      { role: 'system', content: (systemMsg?.content ?? fullSystemPrompt) + summaryCtx },
      ...recent,
    ];

    let response: string;
    try { response = await provider.chat(ctx); }
    catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      emit(options, { type: 'error', sessionId, step, error: msg });
      return `Error calling LLM: ${msg}`;
    }

    session.messages.push({ role: 'assistant', content: response });
    await sessionStore.log(sessionId, { type: 'message', role: 'assistant', content: response });

    const toolCalls = parseToolCalls(response);
    if (toolCalls.length === 0) {
      emit(options, { type: 'final', sessionId, step, content: response });
      emit(options, { type: 'session_end', sessionId });
      return response;
    }

    for (const call of toolCalls) {
      emit(options, { type: 'tool_call', sessionId, step, tool: call.tool, input: call.input });
      const result = await executeTool(call.tool, call.input, sessionId);
      emit(options, { type: 'tool_result', sessionId, step, tool: call.tool, ok: result.ok, output: result.output.slice(0, 500) });

      const truncated = result.output.length > 4000 ? result.output.slice(0, 4000) + '\n...[truncated]' : result.output;
      const msg = `Tool result (${call.tool}, ${result.ok ? 'success' : 'error'}):\n${truncated}`;
      session.messages.push({ role: 'user', content: msg });
      await sessionStore.log(sessionId, { type: 'tool_result', tool: call.tool, ok: result.ok, output: truncated });
    }
  }

  emit(options, { type: 'max_steps', sessionId, step: maxSteps });
  emit(options, { type: 'session_end', sessionId });
  session.messages.push({ role: 'user', content: 'Maximum steps reached. Provide your final answer based on what you have learned.' });
  return provider.chat(session.messages.slice(-contextWindowSize));
}

export async function resumeSession(provider: LLMProvider, sessionId: string, message: string, options: AgentLoopOptions = {}): Promise<string> {
  const session = await sessionStore.restore(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  return runAgentLoop(provider, message, { ...options, session });
}

export async function resumeLatestSession(provider: LLMProvider, message: string, options: AgentLoopOptions = {}): Promise<string> {
  const id = await sessionStore.findLatest();
  if (!id) throw new Error('No previous sessions found');
  return resumeSession(provider, id, message, options);
}

export { sessionStore };
