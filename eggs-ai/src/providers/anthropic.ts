import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import type { LLMProvider, Message } from './base.js';

/**
 * Anthropic Claude provider backed by @ai-sdk/anthropic.
 */
export class AnthropicProvider implements LLMProvider {
  name = 'anthropic';
  private client: ReturnType<typeof createAnthropic>;
  private model: string;

  constructor(
    apiKey: string,
    model = 'claude-sonnet-4-20250514',
    baseURL?: string,
  ) {
    this.client = createAnthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });
    this.model = model;
  }

  async chat(messages: Message[]): Promise<string> {
    const { text } = await generateText({
      model: this.client(this.model),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    return text;
  }

  async chatStream(messages: Message[], onChunk: (chunk: string) => void): Promise<string> {
    const { textStream } = streamText({
      model: this.client(this.model),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    let full = '';
    for await (const chunk of textStream) {
      full += chunk;
      onChunk(chunk);
    }
    return full;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await generateText({
        model: this.client(this.model),
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 1,
      });
      return true;
    } catch {
      return false;
    }
  }
}
