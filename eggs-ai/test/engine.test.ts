import { describe, it, expect, vi } from 'vitest';

describe('InMemoryEventBus', () => {
  it('publishes events to subscribers', async () => {
    const { InMemoryEventBus } = await import('../src/engine/event-bus.js');
    const bus = new InMemoryEventBus<{ type: string; data: number }>();
    const received: Array<{ type: string; data: number }> = [];
    bus.subscribe((e) => received.push(e));
    bus.publish({ type: 'test', data: 42 });
    expect(received).toEqual([{ type: 'test', data: 42 }]);
  });

  it('supports unsubscribe', async () => {
    const { InMemoryEventBus } = await import('../src/engine/event-bus.js');
    const bus = new InMemoryEventBus<string>();
    const received: string[] = [];
    const unsub = bus.subscribe((e) => received.push(e));
    bus.publish('first');
    unsub();
    bus.publish('second');
    expect(received).toEqual(['first']);
  });

  it('does not break on subscriber errors', async () => {
    const { InMemoryEventBus } = await import('../src/engine/event-bus.js');
    const bus = new InMemoryEventBus<string>();
    const received: string[] = [];
    bus.subscribe(() => { throw new Error('boom'); });
    bus.subscribe((e) => received.push(e));
    bus.publish('test');
    expect(received).toEqual(['test']);
  });
});

describe('checkGate', () => {
  it('allows safe commands', async () => {
    const { checkGate } = await import('../src/engine/check-gate.js');
    expect(await checkGate.validate('eggs status')).toEqual({ allowed: true });
  });

  it('allows read-only commands', async () => {
    const { checkGate } = await import('../src/engine/check-gate.js');
    expect(await checkGate.validate('cat /etc/os-release')).toEqual({ allowed: true });
  });

  it('blocks destructive commands without approval', async () => {
    const { checkGate } = await import('../src/engine/check-gate.js');
    checkGate.setApprovalCallback(() => false);
    const r = await checkGate.validate('eggs produce --prefix test');
    expect(r).toHaveProperty('allowed', false);
  });

  it('allows destructive commands with approval', async () => {
    const { checkGate } = await import('../src/engine/check-gate.js');
    checkGate.setApprovalCallback(() => true);
    expect(await checkGate.validate('eggs produce --prefix test')).toEqual({ allowed: true });
  });

  it('blocks rm -rf', async () => {
    const { checkGate } = await import('../src/engine/check-gate.js');
    checkGate.setApprovalCallback(() => false);
    expect(await checkGate.validate('rm -rf /')).toHaveProperty('allowed', false);
  });

  it('tracks failures', async () => {
    const { checkGate } = await import('../src/engine/check-gate.js');
    checkGate.setApprovalCallback(() => false);
    checkGate.clearFailures('test-session');
    await checkGate.validate('eggs kill', 'test-session');
    const failures = checkGate.getFailures('test-session');
    expect(failures.length).toBeGreaterThanOrEqual(1);
    expect(failures[0].command).toContain('eggs kill');
  });
});

describe('Tool definitions', () => {
  it('exports all expected tools', async () => {
    const { ALL_TOOLS } = await import('../src/engine/tool-definitions.js');
    const names = ALL_TOOLS.map((t) => t.name);
    expect(names).toContain('read_file');
    expect(names).toContain('write_file');
    expect(names).toContain('list_files');
    expect(names).toContain('run_shell');
    expect(names).toContain('eggs_run');
    expect(names).toContain('eggs_inspect');
    expect(names).toContain('eggs_knowledge');
    expect(names).toContain('eggs_config_read');
    expect(names).toContain('eggs_config_write');
  });

  it('each tool has required schema fields', async () => {
    const { ALL_TOOLS } = await import('../src/engine/tool-definitions.js');
    for (const tool of ALL_TOOLS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema.type).toBe('object');
    }
  });
});

describe('Tool executor', () => {
  it('executes eggs_inspect', async () => {
    const { executeTool } = await import('../src/engine/tool-executor.js');
    const r = await executeTool('eggs_inspect', {});
    expect(r.ok).toBe(true);
    expect(r.output).toContain('Distro:');
  });

  it('executes eggs_knowledge for commands', async () => {
    const { executeTool } = await import('../src/engine/tool-executor.js');
    const r = await executeTool('eggs_knowledge', { topic: 'commands' });
    expect(r.ok).toBe(true);
    expect(r.output).toContain('eggs produce');
  });

  it('executes eggs_knowledge for issues', async () => {
    const { executeTool } = await import('../src/engine/tool-executor.js');
    const r = await executeTool('eggs_knowledge', { topic: 'issues' });
    expect(r.ok).toBe(true);
    expect(r.output).toContain('Symptom:');
  });

  it('executes list_files', async () => {
    const { executeTool } = await import('../src/engine/tool-executor.js');
    const r = await executeTool('list_files', { path: '.' });
    expect(r.ok).toBe(true);
    expect(r.output.length).toBeGreaterThan(0);
  });

  it('returns error for unknown tool', async () => {
    const { executeTool } = await import('../src/engine/tool-executor.js');
    const r = await executeTool('nonexistent', {});
    expect(r.ok).toBe(false);
    expect(r.output).toContain('Unknown tool');
  });

  it('returns error for missing file', async () => {
    const { executeTool } = await import('../src/engine/tool-executor.js');
    const r = await executeTool('read_file', { path: '/nonexistent/file.txt' });
    expect(r.ok).toBe(false);
    expect(r.output).toContain('not found');
  });
});

describe('Myclaw bridge', () => {
  it('converts eggs tools to myclaw format', async () => {
    const { getEggsToolsForMyclaw } = await import('../src/engine/myclaw-bridge.js');
    const tools = getEggsToolsForMyclaw();
    expect(tools.length).toBeGreaterThan(0);
    for (const t of tools) {
      expect(t.name).toBeTruthy();
      expect(t.inputSchema.additionalProperties).toBe(false);
    }
  });

  it('executes eggs tools via bridge', async () => {
    const { executeEggsToolForMyclaw } = await import('../src/engine/myclaw-bridge.js');
    const r = await executeEggsToolForMyclaw('eggs_inspect', {});
    expect(r.ok).toBe(true);
    expect(r.output).toContain('Distro:');
  });

  it('lists available providers', async () => {
    const { listAvailableProviders } = await import('../src/engine/myclaw-bridge.js');
    const providers = listAvailableProviders();
    expect(providers).toContain('gemini');
    expect(providers).toContain('openai');
    expect(providers).toContain('ollama');
  });
});

describe('SessionStore', () => {
  it('creates and retrieves sessions', async () => {
    const { SessionStore } = await import('../src/engine/session-store.js');
    const store = new SessionStore();
    const s = store.create('/tmp/test');
    expect(s.id).toBeTruthy();
    expect(store.get(s.id)!.id).toBe(s.id);
  });

  it('returns undefined for missing sessions', async () => {
    const { SessionStore } = await import('../src/engine/session-store.js');
    expect(new SessionStore().get('nonexistent')).toBeUndefined();
  });
});

describe('compressContext', () => {
  it('compresses when messages exceed trigger', async () => {
    const { SessionStore, compressContext } = await import('../src/engine/session-store.js');
    const s = new SessionStore().create();
    s.messages.push({ role: 'system', content: 'sys' });
    for (let i = 0; i < 50; i++) {
      s.messages.push({ role: 'user', content: `q${i}` });
      s.messages.push({ role: 'assistant', content: `a${i}` });
    }
    expect(compressContext(s, 40, 20).length).toBeGreaterThan(0);
  });

  it('does not compress when below trigger', async () => {
    const { SessionStore, compressContext } = await import('../src/engine/session-store.js');
    const s = new SessionStore().create();
    s.messages.push({ role: 'system', content: 'sys' }, { role: 'user', content: 'hi' });
    expect(compressContext(s)).toEqual([]);
  });
});

describe('User profile', () => {
  it('returns empty profile when no file exists', async () => {
    const { readUserProfile } = await import('../src/engine/user-profile.js');
    const p = await readUserProfile();
    expect(Array.isArray(p.commonWorkflows)).toBe(true);
    expect(Array.isArray(p.preferences)).toBe(true);
  });
});

describe('Engine module exports', () => {
  it('exports all expected symbols', async () => {
    const e = await import('../src/engine/index.js');
    expect(typeof e.runAgentLoop).toBe('function');
    expect(typeof e.resumeSession).toBe('function');
    expect(typeof e.InMemoryEventBus).toBe('function');
    expect(typeof e.SessionStore).toBe('function');
    expect(typeof e.compressContext).toBe('function');
    expect(e.checkGate).toBeDefined();
    expect(Array.isArray(e.ALL_TOOLS)).toBe(true);
    expect(typeof e.executeTool).toBe('function');
    expect(typeof e.readUserProfile).toBe('function');
    expect(typeof e.loadProfileBrief).toBe('function');
    expect(typeof e.getEggsToolsForMyclaw).toBe('function');
    expect(typeof e.executeEggsToolForMyclaw).toBe('function');
    expect(typeof e.wrapEggsProviderForMyclaw).toBe('function');
    expect(typeof e.createMyclawProvider).toBe('function');
    expect(typeof e.listAvailableProviders).toBe('function');
    expect(typeof e.SessionLogSubscriber).toBe('function');
    expect(typeof e.MetricsSubscriber).toBe('function');
  });
});
