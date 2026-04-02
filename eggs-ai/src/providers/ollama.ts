import { createOllama } from '@ai-sdk/ollama';
import { generateText, streamText } from 'ai';
import type { LLMProvider, Message } from './base.js';

/**
 * Ollama provider for local-first LLM inference, backed by @ai-sdk/ollama.
 * Requires Ollama running locally (default: http://localhost:11434).
 */
export class OllamaProvider implements LLMProvider {
  name = 'ollama';
  private client: ReturnType<typeof createOllama>;
  private model: string;
  private baseURL: string;

  constructor(model = 'llama3.2', baseURL = 'http://localhost:11434') {
    this.baseURL = baseURL;
    this.client = createOllama({ baseURL });
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
      const response = await fetch(`${this.baseURL}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
