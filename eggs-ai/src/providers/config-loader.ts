import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import YAML from 'yaml';
import { ProviderRegistry } from './base.js';
import type { ProviderConfig } from './base.js';
import { CustomProvider } from './custom.js';

/**
 * Config file format (~/.eggs-ai.yaml):
 *
 * default_provider: my-local-llm
 *
 * providers:
 *   - name: deepseek
 *     type: custom
 *     baseUrl: https://api.deepseek.com/v1
 *     envKey: DEEPSEEK_API_KEY
 *     model: deepseek-chat
 *
 *   - name: lmstudio
 *     type: custom
 *     baseUrl: http://localhost:1234/v1
 *     model: local-model
 *
 *   - name: together
 *     type: custom
 *     baseUrl: https://api.together.xyz/v1
 *     envKey: TOGETHER_API_KEY
 *     model: meta-llama/Llama-3-70b-chat-hf
 *
 *   - name: my-openai
 *     type: openai
 *     model: gpt-4o
 *     envKey: MY_OPENAI_KEY
 */

interface UserProviderEntry {
  name: string;
  type: string;
  baseUrl?: string;
  apiKey?: string;
  envKey?: string;
  model?: string;
}

interface UserConfig {
  default_provider?: string;
  providers?: UserProviderEntry[];
}

const CONFIG_PATHS = [
  join(process.cwd(), '.eggs-ai.yaml'),
  join(process.cwd(), '.eggs-ai.yml'),
  join(homedir(), '.eggs-ai.yaml'),
  join(homedir(), '.eggs-ai.yml'),
  join(homedir(), '.config', 'eggs-ai', 'config.yaml'),
  join(homedir(), '.config', 'eggs-ai', 'config.yml'),
];

/**
 * Find and parse the user config file. Returns null if none found.
 */
function findConfig(): { config: UserConfig; path: string } | null {
  for (const configPath of CONFIG_PATHS) {
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        const config = YAML.parse(content) as UserConfig;
        return { config, path: configPath };
      } catch {
        // Skip malformed files
      }
    }
  }
  return null;
}

/**
 * Load user config and register any custom providers defined in it.
 * Returns the default provider name if set, or null.
 */
export function loadUserConfig(): { defaultProvider: string | null; configPath: string | null } {
  const result = findConfig();
  if (!result) {
    return { defaultProvider: null, configPath: null };
  }

  const { config, path } = result;

  if (config.providers) {
    for (const entry of config.providers) {
      if (!entry.name || !entry.type) continue;

      const name = entry.name.toLowerCase();

      // If the type is a built-in provider, register an alias with preset config
      if (ProviderRegistry.has(entry.type) && entry.type !== 'custom') {
        ProviderRegistry.register(name, (runtimeConfig) => {
          const mergedConfig: ProviderConfig = {
            provider: entry.type,
            apiKey: runtimeConfig.apiKey || entry.apiKey || (entry.envKey ? process.env[entry.envKey] : undefined),
            model: runtimeConfig.model || entry.model,
            baseUrl: runtimeConfig.baseUrl || entry.baseUrl,
          };
          return ProviderRegistry.create(mergedConfig);
        });
      } else {
        // Register as a custom OpenAI-compatible provider
        ProviderRegistry.register(name, (runtimeConfig) => {
          const apiKey = runtimeConfig.apiKey
            || entry.apiKey
            || (entry.envKey ? process.env[entry.envKey] : undefined)
            || '';
          const baseUrl = runtimeConfig.baseUrl || entry.baseUrl;
          if (!baseUrl) {
            throw new Error(`Provider "${entry.name}" requires a baseUrl.`);
          }
          return new CustomProvider(
            entry.name,
            baseUrl,
            runtimeConfig.model || entry.model || 'default',
            apiKey,
          );
        });
      }
    }
  }

  return {
    defaultProvider: config.default_provider?.toLowerCase() || null,
    configPath: path,
  };
}
