import type { LLMProvider, Message } from '../providers/index.js';
import { SYSTEM_PROMPT, WARDROBE_COSTUMES } from '../knowledge/eggs-reference.js';
import { inspectSystem } from '../tools/system-inspect.js';

/**
 * Wardrobe agent: helps users discover, understand, and apply
 * penguins-eggs costumes for system customization.
 */
export async function runWardrobeAssistant(
  provider: LLMProvider,
  request?: string,
): Promise<string> {
  const systemInfo = inspectSystem();

  const prompt = `
## System
Distro: ${systemInfo.distro}
Eggs installed: ${systemInfo.eggsInstalled}

## Wardrobe System Reference
${WARDROBE_COSTUMES.description}

Repository: ${WARDROBE_COSTUMES.repository}

Commands:
${WARDROBE_COSTUMES.usage.join('\n')}

Example costumes:
${WARDROBE_COSTUMES.examples.join('\n')}

## Task
${request ? `The user asks: "${request}"` : 'Explain the wardrobe system and how to get started.'}

Provide:
1. Clear explanation relevant to the question
2. Exact commands to run
3. What each costume does (if asking about specific ones)
4. How to create custom costumes (if relevant)
`;

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];

  return provider.chat(messages);
}
