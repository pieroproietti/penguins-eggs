/**
 * Example: Programmatically register a custom LLM provider.
 *
 * This shows how to add a new provider at runtime, useful for:
 * - Integrating a proprietary API
 * - Adding a provider with non-standard auth
 * - Wrapping a local model server with custom logic
 *
 * Usage:
 *   npx tsx examples/register-provider.ts
 */

import { ProviderRegistry } from '../src/providers/index.js';
import type { LLMProvider, Message } from '../src/providers/index.js';

// 1. Implement the LLMProvider interface
class MyCustomProvider implements LLMProvider {
  name = 'my-provider';

  async chat(messages: Message[]): Promise<string> {
    // Replace with your actual API call
    const lastMessage = messages[messages.length - 1];
    return `[my-provider] Echo: ${lastMessage.content}`;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

// 2. Register it with the global registry
ProviderRegistry.register('my-provider', (_config) => {
  return new MyCustomProvider();
});

// 3. Now it's available everywhere
const provider = ProviderRegistry.create({ provider: 'my-provider' });
console.log('Registered provider:', provider.name);
console.log('All providers:', ProviderRegistry.listNames());

// 4. Use it
provider.chat([
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'Hello from custom provider!' },
]).then((response) => {
  console.log('Response:', response);
});
