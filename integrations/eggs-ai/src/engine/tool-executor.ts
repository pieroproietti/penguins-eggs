/**
 * Tool executor: runs tool calls from the agent loop.
 * Combines myclaw's filesystem/shell execution with eggs-ai domain tools.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { checkGate } from './check-gate.js';
import { inspectSystem, formatSystemInfo } from '../tools/system-inspect.js';
import {
  EGGS_COMMANDS, EGGS_COMMON_ISSUES, SUPPORTED_DISTROS, CALAMARES_MODULES, WARDROBE_COSTUMES,
} from '../knowledge/eggs-reference.js';
import { DISTRO_INSTALL_GUIDES, ADVANCED_WORKFLOWS } from '../knowledge/distro-guides.js';

export interface ToolResult { ok: boolean; output: string; }

function run(cmd: string, timeoutMs = 30000): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: timeoutMs }).trim();
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    throw new Error(`Command failed (exit ${e.status ?? 1}): ${e.stderr ?? e.stdout ?? 'unknown error'}`);
  }
}

export async function executeTool(toolName: string, input: Record<string, unknown>, sessionId = 'default'): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'read_file': {
        const path = String(input.path ?? '');
        if (!existsSync(path)) return { ok: false, output: `File not found: ${path}` };
        return { ok: true, output: readFileSync(path, 'utf-8') };
      }
      case 'write_file': {
        const path = String(input.path ?? '');
        const content = String(input.content ?? '');
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content, 'utf-8');
        return { ok: true, output: `Wrote ${content.length} bytes to ${path}` };
      }
      case 'list_files': {
        const path = String(input.path ?? '.');
        if (!existsSync(path)) return { ok: false, output: `Directory not found: ${path}` };
        return { ok: true, output: readdirSync(path).join('\n') || '(empty directory)' };
      }
      case 'run_shell': {
        const command = String(input.command ?? '');
        const check = await checkGate.validate(command, sessionId);
        if (!check.allowed) return { ok: false, output: check.reason };
        return { ok: true, output: run(command, 120000) };
      }
      case 'eggs_run': {
        const args = String(input.args ?? '');
        const fullCmd = `sudo eggs ${args}`;
        const check = await checkGate.validate(fullCmd, sessionId);
        if (!check.allowed) return { ok: false, output: check.reason };
        return { ok: true, output: run(fullCmd, 600000) };
      }
      case 'eggs_inspect':
        return { ok: true, output: formatSystemInfo(inspectSystem()) };
      case 'eggs_knowledge':
        return { ok: true, output: queryKnowledge(String(input.topic ?? '').toLowerCase()) };
      case 'eggs_config_read': {
        const p = '/etc/penguins-eggs.d/eggs.yaml';
        if (!existsSync(p)) return { ok: false, output: 'No eggs.yaml found at ' + p };
        return { ok: true, output: readFileSync(p, 'utf-8') };
      }
      case 'eggs_config_write': {
        const content = String(input.content ?? '');
        const p = '/etc/penguins-eggs.d/eggs.yaml';
        const check = await checkGate.validate(`write ${p}`, sessionId);
        if (!check.allowed) return { ok: false, output: check.reason };
        mkdirSync(dirname(p), { recursive: true });
        writeFileSync(p, content, 'utf-8');
        return { ok: true, output: `Configuration written to ${p}` };
      }
      default:
        return { ok: false, output: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    return { ok: false, output: err instanceof Error ? err.message : String(err) };
  }
}

function queryKnowledge(topic: string): string {
  if (topic === 'commands') {
    return Object.entries(EGGS_COMMANDS).map(([name, info]) => {
      const desc = 'description' in info ? (info as { description: string }).description : '(subcommands)';
      return `eggs ${name}: ${desc}`;
    }).join('\n');
  }
  if (topic.startsWith('distro:')) {
    const d = topic.replace('distro:', '').trim();
    return DISTRO_INSTALL_GUIDES[d] ?? `No guide for "${d}". Available: ${Object.keys(DISTRO_INSTALL_GUIDES).join(', ')}`;
  }
  if (topic === 'issues') return EGGS_COMMON_ISSUES.map((i) => `Symptom: ${i.symptom}\nCauses: ${i.causes.join(', ')}\nFixes: ${i.fixes.join('; ')}`).join('\n\n');
  if (topic === 'wardrobe') return `${WARDROBE_COSTUMES.description}\nUsage: ${WARDROBE_COSTUMES.usage.join('; ')}`;
  if (topic === 'calamares') return Object.entries(CALAMARES_MODULES).map(([k, v]) => `${k}: ${v}`).join('\n');
  if (topic === 'workflows') return Object.entries(ADVANCED_WORKFLOWS).map(([n, g]) => `## ${n}\n${g}`).join('\n\n');
  if (topic === 'distros') return `Supported: ${SUPPORTED_DISTROS.join(', ')}`;

  // Free-text search
  const results: string[] = [];
  for (const [name, info] of Object.entries(EGGS_COMMANDS)) {
    const desc = 'description' in info ? (info as { description: string }).description : '';
    if (name.includes(topic) || desc.toLowerCase().includes(topic)) results.push(`Command: eggs ${name} — ${desc}`);
  }
  for (const issue of EGGS_COMMON_ISSUES) {
    if (issue.symptom.toLowerCase().includes(topic) || issue.causes.some((c) => c.toLowerCase().includes(topic)))
      results.push(`Issue: ${issue.symptom}`);
  }
  return results.length > 0 ? results.join('\n') : `No knowledge found for "${topic}". Try: commands, distro:<name>, issues, wardrobe, calamares, workflows, distros`;
}
