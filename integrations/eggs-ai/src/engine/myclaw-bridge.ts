/**
 * Bridge adapter between eggs-ai and myclaw.
 *
 * Direction 1: Eggs-ai tools in myclaw format — register eggs domain tools
 * as myclaw-compatible tool definitions.
 *
 * Direction 2: Eggs-ai providers in myclaw format — adapt eggs-ai's 7+
 * providers to myclaw's LLMProvider interface.
 */

import { executeTool } from './tool-executor.js';
import { ALL_TOOLS } from './tool-definitions.js';
import type { LLMProvider as EggsProvider, Message } from '../providers/index.js';
import { ProviderRegistry, autoDetectProvider, createProvider } from '../providers/index.js';
import type { ProviderConfig } from '../providers/index.js';

// ─── Direction 1: Eggs tools for myclaw ──────────────────

export interface MyclawToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export function getEggsToolsForMyclaw(): MyclawToolDefinition[] {
  return ALL_TOOLS.map((t) => ({
    name: t.name, description: t.description,
    inputSchema: { type: 'object', properties: t.inputSchema.properties, required: t.inputSchema.required ?? [], additionalProperties: false },
  }));
}

export async function executeEggsToolForMyclaw(toolName: string, input: Record<string, unknown>, sessionId?: string): Promise<{ ok: boolean; output: string }> {
  return executeTool(toolName, input, sessionId);
}

// ─── Direction 2: Eggs providers for myclaw ──────────────

export interface MyclawLLMProvider {
  readonly name: string;
  chat(
    messages: Array<{ role: string; content: string; toolCallId?: string; toolName?: string }>,
    tools?: MyclawToolDefinition[],
    signal?: AbortSignal,
  ): Promise<{ text: string; toolCalls: Array<{ id?: string; name: string; input: Record<string, unknown> }> }>;
}

export function wrapEggsProviderForMyclaw(eggsProvider: EggsProvider): MyclawLLMProvider {
  return {
    name: `eggs:${eggsProvider.name}`,
    async chat(messages) {
      const eggsMessages: Message[] = messages.map((m) => ({ role: m.role as Message['role'], content: m.content }));
      const text = await eggsProvider.chat(eggsMessages);
      const toolCalls: Array<{ id?: string; name: string; input: Record<string, unknown> }> = [];
      for (const match of text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) {
        try {
          const p = JSON.parse(match[1].trim());
          if (typeof p.tool === 'string' && p.input) toolCalls.push({ name: p.tool, input: p.input });
        } catch { /* skip */ }
      }
      return { text, toolCalls };
    },
  };
}

export function createMyclawProvider(config?: ProviderConfig): MyclawLLMProvider {
  return wrapEggsProviderForMyclaw(config ? createProvider(config) : autoDetectProvider());
}

export function listAvailableProviders(): string[] {
  return ProviderRegistry.listNames();
}
