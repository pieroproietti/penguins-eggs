import type { LLMProvider, Message } from '../providers/index.js';
import { SYSTEM_PROMPT, EGGS_CONFIG_REFERENCE } from '../knowledge/eggs-reference.js';
import { inspectSystem } from '../tools/system-inspect.js';

/**
 * Config agent: explains, generates, or validates eggs configuration.
 */
export async function explainConfig(provider: LLMProvider): Promise<string> {
  const systemInfo = inspectSystem();

  if (!systemInfo.eggsConfig) {
    return `No eggs configuration found at ${EGGS_CONFIG_REFERENCE.configPath}.\n\nRun \`sudo eggs dad\` or \`sudo eggs config\` to create one.`;
  }

  const prompt = `
## Current eggs.yaml
\`\`\`yaml
${systemInfo.eggsConfig}
\`\`\`

## Config Field Reference
${JSON.stringify(EGGS_CONFIG_REFERENCE.fields, null, 2)}

## Task
Explain each setting in this eggs.yaml configuration in plain English.
For each field:
- What it does
- Whether the current value is reasonable
- Any recommendations for improvement

Also flag any missing fields that should be set, and any potentially dangerous settings.
`;

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];

  return provider.chat(messages);
}

export async function generateConfig(
  provider: LLMProvider,
  purpose: string,
): Promise<string> {
  const systemInfo = inspectSystem();

  const prompt = `
## System
Distro: ${systemInfo.distro}
Arch: ${systemInfo.arch}
Disk available: ${systemInfo.diskSpace}
Memory: ${systemInfo.memoryMb} MB

## Config Field Reference
${JSON.stringify(EGGS_CONFIG_REFERENCE.fields, null, 2)}

## Task
Generate an eggs.yaml configuration for: "${purpose}"

Output:
1. The complete YAML config file content
2. Brief explanation of each choice
3. The command to apply it: \`sudo cp eggs.yaml ${EGGS_CONFIG_REFERENCE.configPath}\`
`;

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];

  return provider.chat(messages);
}
