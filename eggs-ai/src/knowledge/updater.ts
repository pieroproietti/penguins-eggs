import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Dynamic knowledge updater.
 *
 * Fetches the latest penguins-eggs data from GitHub at runtime:
 * - README (for new commands/flags)
 * - Recent issues (for new problems/solutions)
 * - Release notes (for version changes)
 *
 * Cached locally at ~/.cache/eggs-ai/ with a configurable TTL.
 */

const CACHE_DIR = join(homedir(), '.cache', 'eggs-ai');
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const GITHUB_API = 'https://api.github.com';
const REPO = 'pieroproietti/penguins-eggs';

interface CacheEntry {
  data: string;
  fetchedAt: number;
}

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function readCache(key: string, ttlMs = DEFAULT_TTL_MS): string | null {
  const path = join(CACHE_DIR, `${key}.json`);
  if (!existsSync(path)) return null;

  try {
    const entry = JSON.parse(readFileSync(path, 'utf-8')) as CacheEntry;
    if (Date.now() - entry.fetchedAt < ttlMs) {
      return entry.data;
    }
  } catch {
    // Corrupted cache, ignore
  }
  return null;
}

function writeCache(key: string, data: string): void {
  ensureCacheDir();
  const path = join(CACHE_DIR, `${key}.json`);
  const entry: CacheEntry = { data, fetchedAt: Date.now() };
  writeFileSync(path, JSON.stringify(entry), 'utf-8');
}

async function fetchGitHub(path: string): Promise<string> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'eggs-ai/0.1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.text();
}

// ─── Public API ──────────────────────────────────────────

export interface RecentIssue {
  number: number;
  title: string;
  labels: string[];
  state: string;
  createdAt: string;
  body: string;
}

/**
 * Fetch recent issues from the penguins-eggs repo.
 * Returns the 20 most recent issues (open + closed).
 */
export async function fetchRecentIssues(ttlMs = DEFAULT_TTL_MS): Promise<RecentIssue[]> {
  const cached = readCache('recent-issues', ttlMs);
  if (cached) return JSON.parse(cached);

  try {
    const raw = await fetchGitHub(`/repos/${REPO}/issues?state=all&per_page=20&sort=created&direction=desc`);
    const issues = JSON.parse(raw) as Array<{
      number: number;
      title: string;
      labels: Array<{ name: string }>;
      state: string;
      created_at: string;
      body: string;
    }>;

    const result: RecentIssue[] = issues.map((i) => ({
      number: i.number,
      title: i.title,
      labels: i.labels.map((l) => l.name),
      state: i.state,
      createdAt: i.created_at,
      body: (i.body || '').slice(0, 500), // Truncate long bodies
    }));

    writeCache('recent-issues', JSON.stringify(result));
    return result;
  } catch {
    return [];
  }
}

/**
 * Fetch the latest release info from penguins-eggs.
 */
export async function fetchLatestRelease(ttlMs = DEFAULT_TTL_MS): Promise<{
  version: string;
  name: string;
  body: string;
  publishedAt: string;
} | null> {
  const cached = readCache('latest-release', ttlMs);
  if (cached) return JSON.parse(cached);

  try {
    const raw = await fetchGitHub(`/repos/${REPO}/releases/latest`);
    const release = JSON.parse(raw) as {
      tag_name: string;
      name: string;
      body: string;
      published_at: string;
    };

    const result = {
      version: release.tag_name,
      name: release.name,
      body: (release.body || '').slice(0, 2000),
      publishedAt: release.published_at,
    };

    writeCache('latest-release', JSON.stringify(result));
    return result;
  } catch {
    return null;
  }
}

/**
 * Fetch the README from penguins-eggs for the latest command docs.
 */
export async function fetchReadme(ttlMs = DEFAULT_TTL_MS): Promise<string | null> {
  const cached = readCache('readme', ttlMs);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${REPO}/master/README.md`,
      { headers: { 'User-Agent': 'eggs-ai/0.1.0' } },
    );
    if (!response.ok) return null;

    const text = await response.text();
    // Truncate to keep context manageable
    const truncated = text.slice(0, 8000);
    writeCache('readme', truncated);
    return truncated;
  } catch {
    return null;
  }
}

/**
 * Build a dynamic knowledge context string from fetched data.
 * Suitable for appending to agent prompts.
 */
export async function buildDynamicContext(): Promise<string> {
  const [issues, release, readme] = await Promise.all([
    fetchRecentIssues(),
    fetchLatestRelease(),
    fetchReadme(),
  ]);

  const parts: string[] = [];

  if (release) {
    parts.push(`## Latest Release: ${release.version} (${release.publishedAt})\n${release.body.slice(0, 500)}`);
  }

  if (issues.length > 0) {
    const issueList = issues
      .slice(0, 10)
      .map((i) => `- #${i.number} [${i.state}] ${i.title}`)
      .join('\n');
    parts.push(`## Recent Issues\n${issueList}`);
  }

  if (readme) {
    parts.push(`## README (excerpt)\n${readme.slice(0, 3000)}`);
  }

  return parts.join('\n\n');
}

/**
 * Clear the local cache.
 */
export function clearCache(): void {
  const { rmSync } = require('node:fs') as typeof import('node:fs');
  if (existsSync(CACHE_DIR)) {
    rmSync(CACHE_DIR, { recursive: true, force: true });
  }
}
