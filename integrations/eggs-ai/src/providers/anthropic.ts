import type { LLMProvider, Message } from './base.js';

/**
 * Anthropic Claude provider.
 * Uses the Anthropic Messages API directly via fetch.
 */
export class AnthropicProvider implements LLMProvider {
  name = 'anthropic';
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(
    apiKey: string,
    model = 'claude-sonnet-4-20250514',
    baseUrl = 'https://api.anthropic.com',
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  async chat(messages: Message[]): Promise<string> {
    const systemMsg = messages.find((m) => m.role === 'system');
    const conversationMsgs = messages.filter((m) => m.role !== 'system');

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: systemMsg?.content,
        messages: conversationMsgs.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic error: ${response.status} — ${err}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
    };
    return data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Light check — just verify the key format is plausible
      return this.apiKey.startsWith('sk-ant-');
    } catch {
      return false;
    }
  }
}
