import type { LLMProvider, Message } from '../providers/index.js';
import {
  SYSTEM_PROMPT,
  EGGS_COMMANDS,
  EGGS_COMMON_ISSUES,
  SUPPORTED_DISTROS,
  WARDROBE_COSTUMES,
  CALAMARES_MODULES,
} from '../knowledge/eggs-reference.js';
import { DISTRO_INSTALL_GUIDES, ADVANCED_WORKFLOWS } from '../knowledge/distro-guides.js';
import { buildDynamicContext } from '../knowledge/updater.js';

/**
 * General Q&A agent: answers any question about penguins-eggs
 * using the embedded knowledge base.
 */
export async function askQuestion(
  provider: LLMProvider,
  question: string,
  conversationHistory: Message[] = [],
): Promise<string> {
  // Build a condensed knowledge context
  const commandList = Object.entries(EGGS_COMMANDS)
    .map(([name, info]) => {
      if ('description' in info) {
        return `  eggs ${name}: ${(info as { description: string }).description}`;
      }
      return `  eggs ${name}: (subcommands)`;
    })
    .join('\n');

  const distros = SUPPORTED_DISTROS.join(', ');

  const distroGuidesSummary = Object.entries(DISTRO_INSTALL_GUIDES)
    .map(([distro, guide]) => `### ${distro}\n${guide.trim().split('\n').slice(0, 6).join('\n')}`)
    .join('\n\n');

  const workflowsSummary = Object.entries(ADVANCED_WORKFLOWS)
    .map(([name, guide]) => `- ${name}: ${guide.trim().split('\n')[0]}`)
    .join('\n');

  const knowledgeContext = `
## Penguins-Eggs Command Reference
${commandList}

## Supported Distributions
${distros}

## Distro-Specific Installation (summaries)
${distroGuidesSummary}

## Advanced Workflows
${workflowsSummary}

## Wardrobe System
${WARDROBE_COSTUMES.description}
Usage: ${WARDROBE_COSTUMES.usage.join('; ')}

## Calamares Modules
${Object.entries(CALAMARES_MODULES).map(([k, v]) => `${k}: ${v}`).join('\n')}

## Common Issues (summary)
${EGGS_COMMON_ISSUES.map((i) => `- ${i.symptom}`).join('\n')}
`;

  // Fetch dynamic context (cached, non-blocking on failure)
  let dynamicContext = '';
  try {
    dynamicContext = await buildDynamicContext();
  } catch {
    // Offline or rate-limited — use static knowledge only
  }

  const fullContext = dynamicContext
    ? knowledgeContext + '\n\n## Live Data (from GitHub)\n' + dynamicContext
    : knowledgeContext;

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT + '\n\n' + fullContext },
    ...conversationHistory,
    { role: 'user', content: question },
  ];

  return provider.chat(messages);
}
