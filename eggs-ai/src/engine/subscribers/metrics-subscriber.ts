/**
 * Metrics subscriber: tracks timing, tool usage, and error rates.
 */

import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { AgentEvent } from '../agent-loop.js';

interface State { sessionId: string; startedAtMs: number; lastEventAtMs: number; toolCalls: number; toolErrors: number; steps: number; }

function getMetricsPath(sid: string): string { return join(homedir(), '.eggs-ai', 'metrics', `${sid}.jsonl`); }

export class MetricsSubscriber {
  private readonly states = new Map<string, State>();
  private readonly pending = new Map<string, Promise<void>>();

  async handle(event: AgentEvent): Promise<void> {
    if (!('sessionId' in event)) return;
    const sid = event.sessionId;
    const now = Date.now();
    const ts = new Date(now).toISOString();

    if (event.type === 'start') {
      this.states.set(sid, { sessionId: sid, startedAtMs: now, lastEventAtMs: now, toolCalls: 0, toolErrors: 0, steps: 0 });
      await this.append(sid, { ts, type: 'metrics_start' });
      return;
    }
    const st = this.states.get(sid);
    if (!st) return;
    const delta = now - st.lastEventAtMs;
    st.lastEventAtMs = now;

    if (event.type === 'tool_call') { st.toolCalls++; st.steps = Math.max(st.steps, event.step); await this.append(sid, { ts, type: 'tool_call_metric', step: event.step, tool: event.tool, delta }); }
    else if (event.type === 'tool_result') { if (!event.ok) st.toolErrors++; await this.append(sid, { ts, type: 'tool_result_metric', step: event.step, ok: event.ok, delta }); }
    else if (event.type === 'session_end') {
      await this.append(sid, { ts, type: 'metrics_summary', totalMs: now - st.startedAtMs, steps: st.steps, toolCalls: st.toolCalls, toolErrors: st.toolErrors });
      this.states.delete(sid); this.pending.delete(sid);
    }
  }

  private async append(sid: string, record: Record<string, unknown>): Promise<void> {
    const path = getMetricsPath(sid);
    const prev = this.pending.get(sid) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(async () => {
      try { await mkdir(dirname(path), { recursive: true }); await appendFile(path, JSON.stringify(record) + '\n', 'utf-8'); }
      catch { /* best effort */ }
    });
    this.pending.set(sid, next);
    await next;
  }

  async flush(): Promise<void> { await Promise.all([...this.pending.values()].map((p) => p.catch(() => undefined))); }
}
