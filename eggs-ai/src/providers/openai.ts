import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import type { LLMProvider, Message } from './base.js';

/**
 * OpenAI-compatible provider backed by @ai-sdk/openai.
 * Works with OpenAI API, Azure OpenAI, and any OpenAI-compatible
 * endpoint (e.g., LM Studio, vLLM) via baseURL override.
 */
export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private client: ReturnType<typeof createOpenAI>;
  private model: string;

  constructor(
    apiKey: string,
    model = 'gpt-4o-mini',
    baseURL = 'https://api.openai.com/v1',
  ) {
    this.client = createOpenAI({ apiKey, baseURL });
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
