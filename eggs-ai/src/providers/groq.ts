import { createGroq } from '@ai-sdk/groq';
import { generateText, streamText } from 'ai';
import type { LLMProvider, Message } from './base.js';

/**
 * Groq provider backed by @ai-sdk/groq.
 */
export class GroqProvider implements LLMProvider {
  name = 'groq';
  private client: ReturnType<typeof createGroq>;
  private model: string;

  constructor(
    apiKey: string,
    model = 'llama-3.3-70b-versatile',
    baseURL?: string,
  ) {
    this.client = createGroq({ apiKey, ...(baseURL ? { baseURL } : {}) });
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
