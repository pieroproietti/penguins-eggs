import { describe, it, expect, vi } from 'vitest';
import type { LLMProvider, Message } from '../src/providers/base.js';
import { runDoctor } from '../src/agents/doctor.js';
import { runBuild } from '../src/agents/build.js';
import { askQuestion } from '../src/agents/ask.js';
import { runCalamaresAssistant } from '../src/agents/calamares.js';
import { runWardrobeAssistant } from '../src/agents/wardrobe.js';

function createMockProvider(response = 'mock AI response'): LLMProvider {
  return {
    name: 'mock',
    chat: vi.fn(async (_msgs: Message[]) => response),
    isAvailable: vi.fn(async () => true),
  };
}

describe('Doctor agent', () => {
  it('calls provider.chat with system context', async () => {
    const provider = createMockProvider('diagnosis result');
    const result = await runDoctor(provider, 'ISO fails to boot');

    expect(result).toBe('diagnosis result');
    expect(provider.chat).toHaveBeenCalledTimes(1);

    const messages = (provider.chat as ReturnType<typeof vi.fn>).mock.calls[0][0] as Message[];
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('Eggs-AI');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toContain('ISO fails to boot');
    expect(messages[1].content).toContain('Distro:');
  });

  it('works without a complaint (general health check)', async () => {
    const provider = createMockProvider('all good');
    const result = await runDoctor(provider);

    expect(result).toBe('all good');
    const messages = (provider.chat as ReturnType<typeof vi.fn>).mock.calls[0][0] as Message[];
    expect(messages[1].content).toContain('general health check');
  });
});

describe('Build agent', () => {
  it('includes build options in prompt', async () => {
    const provider = createMockProvider('build plan');
    const result = await runBuild(provider, {
      desktop: 'xfce',
      compression: 'fast',
      description: 'student lab',
    });

    expect(result).toBe('build plan');
    const messages = (provider.chat as ReturnType<typeof vi.fn>).mock.calls[0][0] as Message[];
    expect(messages[1].content).toContain('xfce');
    expect(messages[1].content).toContain('fast');
    expect(messages[1].content).toContain('student lab');
  });

  it('flags missing eggs installation', async () => {
    const provider = createMockProvider('install first');
    await runBuild(provider, {});

    const messages = (provider.chat as ReturnType<typeof vi.fn>).mock.calls[0][0] as Message[];
    // In this test env, eggs is not installed
    expect(messages[1].content).toContain('eggs is not installed');
  });
});

describe('Ask agent', () => {
  it('includes knowledge context in system prompt', async () => {
    const provider = createMockProvider('answer');
    const result = await askQuestion(provider, 'How do I use wardrobe?');

    expect(result).toBe('answer');
    const messages = (provider.chat as ReturnType<typeof vi.fn>).mock.calls[0][0] as Message[];
    expect(messages[0].content).toContain('wardrobe');
    expect(messages[0].content).toContain('Calamares');
    expect(messages[messages.length - 1].content).toBe('How do I use wardrobe?');
  });

  it('passes conversation history', async () => {
    const provider = createMockProvider('follow-up answer');
    const history = [
      { role: 'user' as const, content: 'What is eggs?' },
      { role: 'assistant' as const, content: 'A remastering tool.' },
    ];

    await askQuestion(provider, 'Tell me more', history);

    const messages = (provider.chat as ReturnType<typeof vi.fn>).mock.calls[0][0] as Message[];
    // system + 2 history + 1 new question
    expect(messages.length).toBe(4);
    expect(messages[1].content).toBe('What is eggs?');
    expect(messages[2].content).toBe('A remastering tool.');
    expect(messages[3].content).toBe('Tell me more');
  });
});

describe('Calamares agent', () => {
  it('includes calamares modules in prompt', async () => {
    const provider = createMockProvider('calamares help');
    const result = await runCalamaresAssistant(provider, 'How do I add a partition module?');

    expect(result).toBe('calamares help');
    const messages = (provider.chat as ReturnType<typeof vi.fn>).mock.calls[0][0] as Message[];
    expect(messages[1].content).toContain('partition');
    expect(messages[1].content).toContain('How do I add a partition module?');
  });
});

describe('Wardrobe agent', () => {
  it('includes wardrobe reference in prompt', async () => {
    const provider = createMockProvider('wardrobe help');
    const result = await runWardrobeAssistant(provider, 'What costumes are available?');

    expect(result).toBe('wardrobe help');
    const messages = (provider.chat as ReturnType<typeof vi.fn>).mock.calls[0][0] as Message[];
    expect(messages[1].content).toContain('costumes');
    expect(messages[1].content).toContain('penguins-wardrobe');
  });
});
