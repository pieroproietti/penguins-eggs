import type { LLMProvider, Message } from '../providers/index.js';
import { SYSTEM_PROMPT, CALAMARES_MODULES } from '../knowledge/eggs-reference.js';
import { inspectSystem } from '../tools/system-inspect.js';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const CALAMARES_CONFIG_DIR = '/etc/calamares';

function readCalamaresConfig(): string {
  if (!existsSync(CALAMARES_CONFIG_DIR)) {
    return 'Calamares config directory not found.';
  }

  const files: string[] = [];
  try {
    const entries = readdirSync(CALAMARES_CONFIG_DIR, { recursive: true, encoding: 'utf-8' });
    for (const entry of entries) {
      const path = `${CALAMARES_CONFIG_DIR}/${entry}`;
      if (entry.endsWith('.conf') || entry.endsWith('.yaml') || entry.endsWith('.yml')) {
        try {
          const content = readFileSync(path, 'utf-8');
          files.push(`--- ${path} ---\n${content}`);
        } catch {
          files.push(`--- ${path} --- (unreadable)`);
        }
      }
    }
  } catch {
    return 'Could not read calamares config directory (permission denied?).';
  }

  return files.length > 0 ? files.join('\n\n') : 'No config files found in ' + CALAMARES_CONFIG_DIR;
}

/**
 * Calamares agent: helps configure, troubleshoot, and understand
 * the Calamares graphical installer.
 */
export async function runCalamaresAssistant(
  provider: LLMProvider,
  question?: string,
): Promise<string> {
  const systemInfo = inspectSystem();
  const calamaresConfig = readCalamaresConfig();

  const modulesRef = Object.entries(CALAMARES_MODULES)
    .map(([name, desc]) => `  ${name}: ${desc}`)
    .join('\n');

  const prompt = `
## System
Distro: ${systemInfo.distro}
Calamares installed: ${systemInfo.calamaresInstalled}

## Calamares Modules Reference
${modulesRef}

## Current Calamares Configuration
${calamaresConfig}

## Task
${question ? `The user asks: "${question}"` : 'Provide a general overview of the current Calamares setup.'}

Provide:
1. Analysis of the current configuration (or installation status)
2. Answer to the user's question with exact file paths and content
3. Any issues detected in the config
4. Exact commands to fix problems or make changes
`;

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];

  return provider.chat(messages);
}
