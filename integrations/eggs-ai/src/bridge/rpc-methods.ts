import { autoDetectProvider } from '../providers/index.js';
import { ProviderRegistry } from '../providers/index.js';
import type { LLMProvider } from '../providers/index.js';
import { runDoctor } from '../agents/doctor.js';
import { runBuild, type BuildOptions } from '../agents/build.js';
import { explainConfig, generateConfig } from '../agents/config.js';
import { runCalamaresAssistant } from '../agents/calamares.js';
import { askQuestion } from '../agents/ask.js';
import { runWardrobeAssistant } from '../agents/wardrobe.js';

/**
 * JSON-RPC method handlers for eggs-ai.
 *
 * These can be registered with the eggs-gui daemon to add an `ai.*`
 * method group, or used by a standalone JSON-RPC server.
 *
 * Method schema (extends eggs-gui.json):
 *
 *   ai.doctor    — AI diagnostics
 *   ai.build     — AI-guided build plan
 *   ai.config.explain  — Explain current config
 *   ai.config.generate — Generate config for a purpose
 *   ai.calamares — Calamares assistant
 *   ai.wardrobe  — Wardrobe assistant
 *   ai.ask       — General Q&A
 *   ai.providers — List available providers
 */

interface RpcParams {
  provider?: string;
  model?: string;
  apiKey?: string;
  complaint?: string;
  question?: string;
  purpose?: string;
  build?: BuildOptions;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function resolveProvider(params: RpcParams): LLMProvider {
  if (params.provider) {
    return ProviderRegistry.create({
      provider: params.provider,
      model: params.model,
      apiKey: params.apiKey,
    });
  }
  return autoDetectProvider();
}

export type RpcHandler = (params: RpcParams) => Promise<unknown>;

/**
 * Returns a map of method name -> handler function.
 * Register these with any JSON-RPC server implementation.
 */
export function getAiRpcMethods(): Map<string, RpcHandler> {
  const methods = new Map<string, RpcHandler>();

  methods.set('ai.doctor', async (params) => {
    const provider = resolveProvider(params);
    const result = await runDoctor(provider, params.complaint);
    return { result };
  });

  methods.set('ai.build', async (params) => {
    const provider = resolveProvider(params);
    const result = await runBuild(provider, params.build || {});
    return { result };
  });

  methods.set('ai.config.explain', async (params) => {
    const provider = resolveProvider(params);
    const result = await explainConfig(provider);
    return { result };
  });

  methods.set('ai.config.generate', async (params) => {
    if (!params.purpose) throw new Error('Missing "purpose" parameter');
    const provider = resolveProvider(params);
    const result = await generateConfig(provider, params.purpose);
    return { result };
  });

  methods.set('ai.calamares', async (params) => {
    const provider = resolveProvider(params);
    const result = await runCalamaresAssistant(provider, params.question);
    return { result };
  });

  methods.set('ai.wardrobe', async (params) => {
    const provider = resolveProvider(params);
    const result = await runWardrobeAssistant(provider, params.question);
    return { result };
  });

  methods.set('ai.ask', async (params) => {
    if (!params.question) throw new Error('Missing "question" parameter');
    const provider = resolveProvider(params);
    const result = await askQuestion(provider, params.question, params.history);
    return { result };
  });

  methods.set('ai.providers', async () => {
    return { providers: ProviderRegistry.listNames() };
  });

  return methods;
}
