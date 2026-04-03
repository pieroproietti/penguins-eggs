import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import type { LLMProvider, Message } from './base.js';

/**
 * Google Gemini provider backed by @ai-sdk/google.
 */
export class GeminiProvider implements LLMProvider {
  name = 'gemini';
  private client: ReturnType<typeof createGoogleGenerativeAI>;
  private model: string;

  constructor(apiKey: string, model = 'gemini-2.0-flash') {
    this.client = createGoogleGenerativeAI({ apiKey });
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
