/**
 * Cross-session user profile for eggs-ai.
 * Adapted from myclaw's user-profile.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

export interface EggsUserProfile {
  preferredDistro?: string;
  preferredDesktop?: string;
  preferredCompression?: 'fast' | 'standard' | 'max';
  preferredInstaller?: 'calamares' | 'krill' | 'none';
  commonWorkflows: string[];
  environment: { os?: string; shell?: string; initSystem?: string };
  preferences: string[];
  lastAction?: string;
}

interface ProfileDoc { version: 1; updatedAt: string; profile: EggsUserProfile; }

function getProfilePath(): string { return join(homedir(), '.eggs-ai', 'user-profile.json'); }

function emptyProfile(): ProfileDoc {
  return { version: 1, updatedAt: new Date().toISOString(), profile: { commonWorkflows: [], environment: {}, preferences: [] } };
}

export async function readUserProfile(): Promise<EggsUserProfile> {
  const path = getProfilePath();
  if (!existsSync(path)) return emptyProfile().profile;
  try {
    const doc = JSON.parse(await readFile(path, 'utf-8')) as ProfileDoc;
    return doc.version === 1 && doc.profile ? doc.profile : emptyProfile().profile;
  } catch { return emptyProfile().profile; }
}

export async function updateUserProfile(update: Partial<EggsUserProfile>): Promise<boolean> {
  const current = await readUserProfile();
  const next: EggsUserProfile = { ...current };
  if (update.preferredDistro) next.preferredDistro = update.preferredDistro;
  if (update.preferredDesktop) next.preferredDesktop = update.preferredDesktop;
  if (update.preferredCompression) next.preferredCompression = update.preferredCompression;
  if (update.preferredInstaller) next.preferredInstaller = update.preferredInstaller;
  if (update.commonWorkflows?.length) next.commonWorkflows = [...new Set([...next.commonWorkflows, ...update.commonWorkflows])].slice(0, 20);
  if (update.environment) next.environment = { ...next.environment, ...update.environment };
  if (update.preferences?.length) next.preferences = [...new Set([...next.preferences, ...update.preferences])].slice(0, 30);
  if (update.lastAction) next.lastAction = update.lastAction;

  if (JSON.stringify(next) === JSON.stringify(current)) return false;
  const path = getProfilePath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), profile: next }, null, 2) + '\n', 'utf-8');
  return true;
}

export async function loadProfileBrief(): Promise<string | undefined> {
  const p = await readUserProfile();
  const lines: string[] = [];
  if (p.preferredDistro) lines.push(`- distro: ${p.preferredDistro}`);
  if (p.preferredDesktop) lines.push(`- desktop: ${p.preferredDesktop}`);
  if (p.preferredCompression) lines.push(`- compression: ${p.preferredCompression}`);
  if (p.preferredInstaller) lines.push(`- installer: ${p.preferredInstaller}`);
  if (p.commonWorkflows.length) lines.push(`- workflows: ${p.commonWorkflows.join(', ')}`);
  if (p.environment.os) lines.push(`- os: ${p.environment.os}`);
  if (p.environment.initSystem) lines.push(`- init: ${p.environment.initSystem}`);
  if (p.preferences.length) lines.push(`- preferences: ${p.preferences.join(', ')}`);
  return lines.length > 0 ? lines.join('\n') : undefined;
}
