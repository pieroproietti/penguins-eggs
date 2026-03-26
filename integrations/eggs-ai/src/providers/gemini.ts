import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMProvider, Message } from './base.js';

export class GeminiProvider implements LLMProvider {
  name = 'gemini';
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model = 'gemini-2.0-flash') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async chat(messages: Message[]): Promise<string> {
    const model = this.client.getGenerativeModel({ model: this.model });

    // Extract system instruction and conversation history
    const systemMsg = messages.find((m) => m.role === 'system');
    const conversationMsgs = messages.filter((m) => m.role !== 'system');

    const chat = model.startChat({
      systemInstruction: systemMsg?.content,
      history: conversationMsgs.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    });

    const lastMsg = conversationMsgs[conversationMsgs.length - 1];
    const result = await chat.sendMessage(lastMsg.content);
    return result.response.text();
  }

  async isAvailable(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      await model.generateContent('ping');
      return true;
    } catch {
      return false;
    }
  }
}
