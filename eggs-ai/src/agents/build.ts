import type { LLMProvider, Message } from '../providers/index.js';
import { SYSTEM_PROMPT, EGGS_COMMANDS, EGGS_CONFIG_REFERENCE } from '../knowledge/eggs-reference.js';
import { inspectSystem, formatSystemInfo } from '../tools/system-inspect.js';

export interface BuildOptions {
  desktop?: string;
  installer?: 'calamares' | 'krill' | 'none';
  compression?: 'fast' | 'standard' | 'max';
  prefix?: string;
  basename?: string;
  clone?: boolean;
  release?: boolean;
  dryRun?: boolean;
  description?: string;
}

/**
 * Build agent: generates the correct eggs produce command and config
 * based on user requirements.
 */
export async function runBuild(
  provider: LLMProvider,
  options: BuildOptions,
): Promise<string> {
  const systemInfo = inspectSystem();
  const formatted = formatSystemInfo(systemInfo);

  const produceRef = EGGS_COMMANDS.produce;
  const configRef = EGGS_CONFIG_REFERENCE;

  const buildPrompt = `
## System Info
${formatted}

## User's Build Requirements
${options.description ? `Description: "${options.description}"` : 'No specific description provided.'}
Desktop: ${options.desktop ?? 'not specified'}
Installer: ${options.installer ?? 'not specified'}
Compression: ${options.compression ?? 'not specified'}
Prefix: ${options.prefix ?? 'not specified'}
Basename: ${options.basename ?? 'not specified'}
Clone mode: ${options.clone ?? false}
Release mode: ${options.release ?? false}
Dry run: ${options.dryRun ?? false}

## Available produce flags
${JSON.stringify(produceRef.flags, null, 2)}

## Config file fields (${configRef.configPath})
${JSON.stringify(configRef.fields, null, 2)}

## Task
Generate a complete build plan for creating a live ISO with penguins-eggs.

Provide:
1. Pre-build checklist (disk space, dependencies, etc.)
2. Any config changes needed in eggs.yaml (show exact YAML)
3. The exact \`sudo eggs produce\` command with all appropriate flags
4. Post-build verification steps
5. If dry-run mode: show what would happen without executing

${!systemInfo.eggsInstalled ? 'IMPORTANT: eggs is not installed. Start with installation instructions for ' + systemInfo.distro + '.' : ''}
${!systemInfo.eggsConfigExists ? 'IMPORTANT: eggs is not configured. Include `sudo eggs dad` or `sudo eggs config` as the first step.' : ''}
`;

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildPrompt },
  ];

  return provider.chat(messages);
}
