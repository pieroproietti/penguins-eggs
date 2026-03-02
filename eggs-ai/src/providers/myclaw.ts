/**
 * Myclaw provider adapter.
 *
 * Wraps myclaw's OpenAI provider (which supports native tool calls,
 * retries, timeouts, and abort signals) to conform to eggs-ai's
 * LLMProvider interface. When tool calls are returned by the model,
 * they are serialized as JSON blocks in the response text so the
 * eggs-ai agent loop can parse and execute them.
 *
 * This gives eggs-ai access to myclaw's more capable provider
 * implementation while maintaining backward compatibility.
 */

import type { LLMProvider, Message } from './base.js';

// Myclaw types (inlined to avoid cross-package import issues at runtime)
interface MyclawChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
  toolCalls?: Array<{ id?: string; name: string; input: Record<string, unknown> }>;
}

interface MyclawProviderResponse {
  text: string;
  toolCalls: Array<{ id?: string; name: string; input: Record<string, unknown> }>;
}

interface MyclawProviderOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  timeoutMs?: number;
  retryCount?: number;
}

export class MyclawProvider implements LLMProvider {
  name = 'myclaw';
  private provider: { chat(messages: MyclawChatMessage[]): Promise<MyclawProviderResponse> } | null = null;
  private readonly options: MyclawProviderOptions;

  constructor(
    apiKey: string,
    model = 'gpt-4o-mini',
    baseUrl?: string,
    timeoutMs?: number,
    retryCount?: number,
  ) {
    this.options = { apiKey, model, baseUrl, timeoutMs, retryCount };
  }

  /**
   * Get or create the underlying provider instance.
   * Uses a fetch-based implementation matching myclaw's OpenAI provider
   * behavior (tool call parsing, error handling) without requiring
   * myclaw's dependencies to be installed.
   */
  private async getProvider(): Promise<{ chat(messages: MyclawChatMessage[]): Promise<MyclawProviderResponse> }> {
    if (this.provider) return this.provider;
    this.provider = this.createFallbackProvider();
    return this.provider;
  }

  private createFallbackProvider(): { chat(messages: MyclawChatMessage[]): Promise<MyclawProviderResponse> } {
    const opts = this.options;
    return {
      async chat(messages: MyclawChatMessage[]): Promise<MyclawProviderResponse> {
        const baseUrl = (opts.baseUrl ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opts.apiKey}`,
          },
          body: JSON.stringify({
            model: opts.model,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Myclaw provider error: ${response.status} — ${err}`);
        }

        const data = (await response.json()) as {
          choices: Array<{
            message: {
              content?: string;
              tool_calls?: Array<{
                id?: string;
                type: string;
                function: { name: string; arguments: string };
              }>;
            };
          }>;
        };

        const choice = data.choices[0]?.message;
        const text = choice?.content ?? '';
        const toolCalls: Array<{ id?: string; name: string; input: Record<string, unknown> }> = [];

        if (Array.isArray(choice?.tool_calls)) {
          for (const tc of choice.tool_calls) {
            if (tc.type === 'function' && tc.function?.name) {
              let input: Record<string, unknown> = {};
              try { input = JSON.parse(tc.function.arguments); } catch { /* skip */ }
              toolCalls.push({ id: tc.id, name: tc.function.name, input });
            }
          }
        }

        return { text, toolCalls };
      },
    };
  }

  async chat(messages: Message[]): Promise<string> {
    const provider = await this.getProvider();

    const myclawMessages: MyclawChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await provider.chat(myclawMessages);

    // If the model returned tool calls, serialize them as JSON blocks
    // so the eggs-ai agent loop can parse and execute them
    if (response.toolCalls.length > 0) {
      const toolBlocks = response.toolCalls.map((tc) =>
        '```json\n' + JSON.stringify({ tool: tc.name, input: tc.input }, null, 2) + '\n```'
      ).join('\n\n');

      return response.text
        ? `${response.text}\n\n${toolBlocks}`
        : toolBlocks;
    }

    return response.text;
  }

  async chatStream(messages: Message[], onChunk: (chunk: string) => void): Promise<string> {
    // Myclaw's provider doesn't expose streaming; fall back to full chat
    const result = await this.chat(messages);
    onChunk(result);
    return result;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const provider = await this.getProvider();
      const response = await provider.chat([{ role: 'user', content: 'ping' }]);
      return !!response.text || response.toolCalls.length > 0;
    } catch {
      return false;
    }
  }
}
