/**
 * Session log subscriber: persists agent events to JSONL files.
 */

import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { AgentEvent } from '../agent-loop.js';

function getLogPath(sessionId: string): string {
  return join(homedir(), '.eggs-ai', 'sessions', `${sessionId}.jsonl`);
}

export class SessionLogSubscriber {
  private readonly pending = new Map<string, Promise<void>>();

  async handle(event: AgentEvent): Promise<void> {
    if (!('sessionId' in event)) return;
    const { sessionId } = event;
    const record: Record<string, unknown> = { ts: new Date().toISOString(), type: event.type, sessionId };

    if ('step' in event) record.step = event.step;
    if ('tool' in event) record.tool = event.tool;
    if ('input' in event) record.input = event.input;
    if ('ok' in event) record.ok = event.ok;
    if ('output' in event) record.output = (event.output as string).slice(0, 2000);
    if ('content' in event) record.content = (event.content as string).slice(0, 4000);
    if ('error' in event) record.error = event.error;
    if ('from' in event) { record.from = event.from; record.to = event.to; }

    await this.append(sessionId, record);
  }

  private async append(sessionId: string, record: Record<string, unknown>): Promise<void> {
    const logPath = getLogPath(sessionId);
    const prev = this.pending.get(sessionId) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(async () => {
      try { await mkdir(dirname(logPath), { recursive: true }); await appendFile(logPath, JSON.stringify(record) + '\n', 'utf-8'); }
      catch { /* best effort */ }
    });
    this.pending.set(sessionId, next);
    await next;
  }

  async flush(): Promise<void> { await Promise.all([...this.pending.values()].map((p) => p.catch(() => undefined))); }
}
