import type { LLMProvider, Message } from './base.js';

/**
 * Ollama provider for local-first LLM inference.
 * Requires Ollama running locally (default: http://localhost:11434).
 */
export class OllamaProvider implements LLMProvider {
  name = 'ollama';
  private baseUrl: string;
  private model: string;

  constructor(model = 'llama3.2', baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async chat(messages: Message[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { message: { content: string } };
    return data.message.content;
  }

  async chatStream(messages: Message[], onChunk: (chunk: string) => void): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    let full = '';
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      // Ollama streams newline-delimited JSON
      for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line) as { message?: { content: string }; done: boolean };
          if (data.message?.content) {
            full += data.message.content;
            onChunk(data.message.content);
          }
        } catch {
          // partial JSON, skip
        }
      }
    }
    return full;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
