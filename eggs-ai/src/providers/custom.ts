import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import type { LLMProvider, Message } from './base.js';

/**
 * Generic OpenAI-compatible provider for arbitrary endpoints, backed by @ai-sdk/openai.
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
  private client: ReturnType<typeof createOpenAI>;
  private model: string;
  private baseURL: string;

  constructor(
    name: string,
    baseURL: string,
    model: string,
    apiKey = '',
  ) {
    this.name = name;
    this.baseURL = baseURL.replace(/\/+$/, '');
    this.model = model;
    this.client = createOpenAI({ apiKey: apiKey || 'no-key', baseURL: this.baseURL });
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
