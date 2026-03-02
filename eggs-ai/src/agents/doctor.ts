import type { LLMProvider, Message } from '../providers/index.js';
import { SYSTEM_PROMPT, EGGS_COMMON_ISSUES, EGGS_CONFIG_REFERENCE } from '../knowledge/eggs-reference.js';
import { TROUBLESHOOTING_ADVANCED } from '../knowledge/distro-guides.js';
import { inspectSystem, formatSystemInfo } from '../tools/system-inspect.js';

/**
 * Doctor agent: diagnoses system issues related to penguins-eggs.
 * Inspects the running system, feeds context to the LLM, and returns
 * actionable fix commands.
 */
export async function runDoctor(
  provider: LLMProvider,
  userComplaint?: string,
): Promise<string> {
  const systemInfo = inspectSystem();
  const formatted = formatSystemInfo(systemInfo);

  const allIssues = [
    ...EGGS_COMMON_ISSUES,
    ...TROUBLESHOOTING_ADVANCED.map((t) => ({
      symptom: t.symptom,
      causes: [t.diagnosis],
      fixes: [t.fix],
    })),
  ];

  const issuesContext = allIssues.map(
    (issue) =>
      `Symptom: ${issue.symptom}\nCauses: ${issue.causes.join(', ')}\nFixes: ${issue.fixes.join('; ')}`,
  ).join('\n\n');

  const configContext = systemInfo.eggsConfig
    ? `Current eggs.yaml:\n${systemInfo.eggsConfig}`
    : 'No eggs configuration found at ' + EGGS_CONFIG_REFERENCE.configPath;

  const diagnosticPrompt = `
## System Diagnostic Report

${formatted}

## Eggs Configuration
${configContext}

## Known Issues Database
${issuesContext}

## Task
Analyze this system for penguins-eggs issues. ${userComplaint ? `The user reports: "${userComplaint}"` : 'Perform a general health check.'}

Provide:
1. A summary of detected issues (or confirm the system looks healthy)
2. For each issue: what's wrong, why, and the exact command(s) to fix it
3. Any warnings about the current configuration
4. Recommended next steps

Be specific. Show exact commands. If eggs is not installed, explain how to install it for this distro.
`;

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: diagnosticPrompt },
  ];

  return provider.chat(messages);
}
