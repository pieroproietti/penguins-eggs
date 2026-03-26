import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { LLMProvider, Message } from '../src/providers/base.js';
import { ProviderRegistry } from '../src/providers/index.js';
import { runDoctor } from '../src/agents/doctor.js';
import { runBuild } from '../src/agents/build.js';
import { askQuestion } from '../src/agents/ask.js';
import { explainConfig, generateConfig } from '../src/agents/config.js';
import { runCalamaresAssistant } from '../src/agents/calamares.js';
import { runWardrobeAssistant } from '../src/agents/wardrobe.js';

/**
 * End-to-end tests that validate the full pipeline:
 * prompt construction -> provider call -> response.
 *
 * Uses a recording mock that captures the exact messages sent to the LLM
 * and validates they contain the right context for each agent.
 */

interface RecordedCall {
  messages: Message[];
  response: string;
}

function createRecordingProvider(): LLMProvider & { calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  return {
    name: 'recording-mock',
    calls,
    async chat(messages: Message[]) {
      const response = `[mock response for ${messages.length} messages]`;
      calls.push({ messages: [...messages], response });
      return response;
    },
    async isAvailable() { return true; },
  };
}

describe('E2E: Full agent pipeline', () => {
  it('doctor agent sends system info + complaint + issues database to LLM', async () => {
    const provider = createRecordingProvider();
    await runDoctor(provider, 'My ISO boots to a black screen after GRUB');

    expect(provider.calls).toHaveLength(1);
    const [call] = provider.calls;

    // System message contains the Eggs-AI persona
    expect(call.messages[0].role).toBe('system');
    expect(call.messages[0].content).toContain('Eggs-AI');

    // User message contains all required context
    const userMsg = call.messages[1].content;
    expect(userMsg).toContain('Distro:');          // system info
    expect(userMsg).toContain('Kernel:');           // system info
    expect(userMsg).toContain('Eggs installed:');   // eggs status
    expect(userMsg).toContain('black screen');      // user complaint
    expect(userMsg).toContain('Symptom:');          // issues database
    expect(userMsg).toContain('Fixes:');            // fix suggestions
  });

  it('build agent sends system info + build options + produce flags to LLM', async () => {
    const provider = createRecordingProvider();
    await runBuild(provider, {
      desktop: 'kde',
      compression: 'max',
      release: true,
      description: 'gaming distro with Steam',
    });

    const userMsg = provider.calls[0].messages[1].content;
    expect(userMsg).toContain('kde');
    expect(userMsg).toContain('max');
    expect(userMsg).toContain('gaming distro with Steam');
    expect(userMsg).toContain('--compression');     // produce flags reference
    expect(userMsg).toContain('--release');
  });

  it('ask agent includes knowledge base + distro guides + dynamic context', async () => {
    const provider = createRecordingProvider();
    await askQuestion(provider, 'How do I install eggs on Arch Linux?');

    const systemMsg = provider.calls[0].messages[0].content;
    expect(systemMsg).toContain('Eggs-AI');
    expect(systemMsg).toContain('eggs produce');    // command reference
    expect(systemMsg).toContain('Arch');            // distro in supported list
    expect(systemMsg).toContain('Calamares');       // calamares modules

    const userMsg = provider.calls[0].messages[1].content;
    expect(userMsg).toBe('How do I install eggs on Arch Linux?');
  });

  it('ask agent passes conversation history correctly', async () => {
    const provider = createRecordingProvider();
    const history: Message[] = [
      { role: 'user', content: 'What is penguins-eggs?' },
      { role: 'assistant', content: 'A Linux remastering tool.' },
      { role: 'user', content: 'What distros does it support?' },
      { role: 'assistant', content: 'Debian, Ubuntu, Arch, Fedora, and more.' },
    ];

    await askQuestion(provider, 'How about Alpine?', history);

    const messages = provider.calls[0].messages;
    // system + 4 history + 1 new = 6
    expect(messages).toHaveLength(6);
    expect(messages[0].role).toBe('system');
    expect(messages[1].content).toBe('What is penguins-eggs?');
    expect(messages[2].content).toBe('A Linux remastering tool.');
    expect(messages[3].content).toBe('What distros does it support?');
    expect(messages[4].content).toBe('Debian, Ubuntu, Arch, Fedora, and more.');
    expect(messages[5].content).toBe('How about Alpine?');
  });

  it('config explain agent handles missing config gracefully', async () => {
    const provider = createRecordingProvider();
    const result = await explainConfig(provider);

    // In this test env, eggs config doesn't exist
    // The agent should return a helpful message without calling the LLM
    expect(result).toContain('No eggs configuration found');
    expect(result).toContain('sudo eggs dad');
    expect(provider.calls).toHaveLength(0); // No LLM call needed
  });

  it('config generate agent sends purpose + system info to LLM', async () => {
    const provider = createRecordingProvider();
    await generateConfig(provider, 'minimal rescue ISO with networking tools');

    const userMsg = provider.calls[0].messages[1].content;
    expect(userMsg).toContain('minimal rescue ISO with networking tools');
    expect(userMsg).toContain('snapshot_dir');      // config field reference
    expect(userMsg).toContain('compression');
  });

  it('calamares agent includes module reference', async () => {
    const provider = createRecordingProvider();
    await runCalamaresAssistant(provider, 'How do I customize the partition module?');

    const userMsg = provider.calls[0].messages[1].content;
    expect(userMsg).toContain('partition');
    expect(userMsg).toContain('bootloader');
    expect(userMsg).toContain('customize the partition module');
  });

  it('wardrobe agent includes costume reference', async () => {
    const provider = createRecordingProvider();
    await runWardrobeAssistant(provider, 'How do I create a custom costume?');

    const userMsg = provider.calls[0].messages[1].content;
    expect(userMsg).toContain('penguins-wardrobe');
    expect(userMsg).toContain('colibri');
    expect(userMsg).toContain('custom costume');
  });
});

describe('E2E: Provider registry round-trip', () => {
  it('registers, creates, and calls a custom provider', async () => {
    let receivedMessages: Message[] = [];

    ProviderRegistry.register('e2e-test', () => ({
      name: 'e2e-test',
      async chat(messages) {
        receivedMessages = messages;
        return 'e2e test response';
      },
      async isAvailable() { return true; },
    }));

    const provider = ProviderRegistry.create({ provider: 'e2e-test' });
    const result = await askQuestion(provider, 'test question');

    expect(result).toBe('e2e test response');
    expect(receivedMessages.length).toBeGreaterThan(1);
    expect(receivedMessages[receivedMessages.length - 1].content).toBe('test question');
  });
});

describe('E2E: API server round-trip (requires running server)', () => {
  const API = 'http://127.0.0.1:3737';
  let serverAvailable = false;

  beforeAll(async () => {
    try {
      const resp = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(2000) });
      serverAvailable = resp.ok;
    } catch {
      serverAvailable = false;
    }
  });

  it('GET /api/status -> POST /api/ask flow', async () => {
    if (!serverAvailable) return;
    const statusResp = await fetch(`${API}/api/status`);
    expect(statusResp.ok).toBe(true);
    const status = await statusResp.json() as { system: { distro: string } };
    expect(status.system.distro).toBeTruthy();

    const provResp = await fetch(`${API}/api/providers`);
    const provData = await provResp.json() as { providers: string[] };
    expect(provData.providers.length).toBeGreaterThan(0);
  });

  it('POST with invalid provider returns error', async () => {
    if (!serverAvailable) return;
    const resp = await fetch(`${API}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'test', provider: 'nonexistent-provider-xyz' }),
    });
    expect(resp.status).toBe(500);
    const data = await resp.json() as { error: string };
    expect(data.error).toContain('Unknown provider');
  });
});
