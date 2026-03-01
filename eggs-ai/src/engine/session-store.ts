/**
 * Session management with JSONL persistence and context compression.
 * Adapted from myclaw's session-store for eggs-ai.
 */

import { randomUUID } from 'node:crypto';
import { appendFile, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { Message } from '../providers/index.js';

export interface SessionSummaryBlock {
  ts: string;
  from: number;
  to: number;
  content: string;
}

export interface AgentSession {
  id: string;
  messages: Message[];
  summaries: SessionSummaryBlock[];
  compressedCount: number;
  workspace: string;
  logPath?: string;
  createdAt: string;
}

function getSessionsDir(): string {
  return join(homedir(), '.eggs-ai', 'sessions');
}

function getSessionLogPath(sessionId: string): string {
  return join(getSessionsDir(), `${sessionId}.jsonl`);
}

export class SessionStore {
  private readonly sessions = new Map<string, AgentSession>();

  create(workspace = process.cwd()): AgentSession {
    const id = randomUUID();
    const session: AgentSession = {
      id,
      messages: [],
      summaries: [],
      compressedCount: 0,
      workspace,
      logPath: getSessionLogPath(id),
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(id, session);
    return session;
  }

  get(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId);
  }

  has(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /** Restore a session from its JSONL log file. */
  async restore(sessionId: string): Promise<AgentSession | null> {
    const logPath = getSessionLogPath(sessionId);
    if (!existsSync(logPath)) return null;

    const raw = await readFile(logPath, 'utf-8');
    const lines = raw.split('\n').filter(Boolean);
    const messages: Message[] = [];
    const summaries: SessionSummaryBlock[] = [];
    let workspace = process.cwd();

    for (const line of lines) {
      try {
        const record = JSON.parse(line) as Record<string, unknown>;
        if (record.type === 'session_start' && typeof record.workspace === 'string') {
          workspace = record.workspace;
        }
        if (record.type === 'message' && typeof record.role === 'string' && typeof record.content === 'string') {
          messages.push({ role: record.role as Message['role'], content: record.content });
        }
        if (record.type === 'summary') {
          summaries.push({
            ts: record.ts as string,
            from: record.from as number,
            to: record.to as number,
            content: record.content as string,
          });
        }
      } catch {
        continue;
      }
    }

    const session: AgentSession = {
      id: sessionId, messages, summaries, compressedCount: 0,
      workspace, logPath, createdAt: new Date().toISOString(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  /** Find the most recent session log file. */
  async findLatest(): Promise<string | null> {
    const dir = getSessionsDir();
    if (!existsSync(dir)) return null;

    const files = await readdir(dir);
    const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));
    if (jsonlFiles.length === 0) return null;

    let latest = '';
    let latestTime = 0;
    for (const file of jsonlFiles) {
      const s = await stat(join(dir, file));
      if (s.mtimeMs > latestTime) {
        latestTime = s.mtimeMs;
        latest = file;
      }
    }
    return latest ? latest.replace('.jsonl', '') : null;
  }

  /** Append a record to the session's JSONL log. */
  async log(sessionId: string, record: Record<string, unknown>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session?.logPath) return;
    try {
      await mkdir(dirname(session.logPath), { recursive: true });
      await appendFile(session.logPath, JSON.stringify({ ts: new Date().toISOString(), ...record }) + '\n', 'utf-8');
    } catch { /* best effort */ }
  }
}

/** Compress old messages into summary blocks to keep context manageable. */
export function compressContext(session: AgentSession, triggerSize = 40, chunkSize = 20): SessionSummaryBlock[] {
  const nonSystem = session.messages.filter((m) => m.role !== 'system');
  const newSummaries: SessionSummaryBlock[] = [];

  while (nonSystem.length - session.compressedCount > triggerSize) {
    const start = session.compressedCount;
    const chunk = nonSystem.slice(start, start + chunkSize);
    if (chunk.length === 0) break;

    const userNotes = chunk.filter((m) => m.role === 'user').map((m) => m.content.slice(0, 180)).slice(-3);
    const assistantNotes = chunk.filter((m) => m.role === 'assistant').map((m) => m.content.slice(0, 180)).slice(-3);
    const content = [
      userNotes.length ? `user: ${userNotes.join(' | ')}` : '',
      assistantNotes.length ? `assistant: ${assistantNotes.join(' | ')}` : '',
    ].filter(Boolean).join('\n');

    const summary: SessionSummaryBlock = {
      ts: new Date().toISOString(), from: start, to: start + chunk.length - 1,
      content: content || '(empty)',
    };
    session.summaries.push(summary);
    newSummaries.push(summary);
    session.compressedCount += chunk.length;
  }
  return newSummaries;
}
