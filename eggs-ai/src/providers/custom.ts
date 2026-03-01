import type { LLMProvider, Message } from './base.js';
import { openaiStreamChat } from './openai-stream.js';

/**
 * Generic OpenAI-compatible provider for arbitrary endpoints.
 * Works with: LM Studio, vLLM, text-generation-webui, LocalAI,
 * Together AI, Fireworks AI, Perplexity, DeepSeek, or any service
 * that implements the OpenAI chat completions API format.
 *
 * Usage via config file:
 *   providers:
 *     - name: lmstudio
 *       type: custom
 *       baseUrl: http://localhost:1234/v1
 *       model: local-model
 *
 *     - name: together
 *       type: custom
 *       baseUrl: https://api.together.xyz/v1
 *       envKey: TOGETHER_API_KEY
 *       model: meta-llama/Llama-3-70b-chat-hf
 */
export class CustomProvider implements LLMProvider {
  name: string;
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(
    name: string,
    baseUrl: string,
    model: string,
    apiKey = '',
  ) {
    this.name = name;
    this.baseUrl = baseUrl.replace(/\/+$/, ''); // strip trailing slashes
    this.model = model;
    this.apiKey = apiKey;
  }

  async chat(messages: Message[]): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
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
      throw new Error(`${this.name} error: ${response.status} — ${err}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0].message.content;
  }

  async chatStream(messages: Message[], onChunk: (chunk: string) => void): Promise<string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    return openaiStreamChat(
      `${this.baseUrl}/chat/completions`,
      headers,
      this.model,
      messages.map((m) => ({ role: m.role, content: m.content })),
      onChunk,
    );
  }

  async isAvailable(): Promise<boolean> {
    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      const response = await fetch(`${this.baseUrl}/models`, { headers });
      return response.ok;
    } catch {
      return false;
    }
  }
}
