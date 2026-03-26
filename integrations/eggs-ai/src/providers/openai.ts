import type { LLMProvider, Message } from './base.js';
import { openaiStreamChat } from './openai-stream.js';

/**
 * OpenAI-compatible provider. Works with OpenAI API, Azure OpenAI,
 * and any OpenAI-compatible endpoint (e.g., LM Studio, vLLM).
 */
export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(
    apiKey: string,
    model = 'gpt-4o-mini',
    baseUrl = 'https://api.openai.com/v1',
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  async chat(messages: Message[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${response.status} — ${err}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0].message.content;
  }

  async chatStream(messages: Message[], onChunk: (chunk: string) => void): Promise<string> {
    return openaiStreamChat(
      `${this.baseUrl}/chat/completions`,
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      this.model,
      messages.map((m) => ({ role: m.role, content: m.content })),
      onChunk,
    );
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
