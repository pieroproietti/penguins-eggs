#!/usr/bin/env node

/**
 * CLI entry point for eggs-ai.
 *
 * Each command maps to an agent function (src/agents/) or a utility.
 * Provider resolution: --provider flag → config file default → env var auto-detect → Ollama.
 *
 * Commands that need an LLM: doctor, build, config, calamares, wardrobe, ask, chat
 * Commands that don't: status, providers, update, mcp, serve (serve starts the server, not calls it)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createRequire } from 'node:module';
import { autoDetectProvider, createProvider, ProviderRegistry } from './providers/index.js';
import type { LLMProvider, ProviderConfig } from './providers/index.js';
import { loadUserConfig } from './providers/config-loader.js';
import { runDoctor } from './agents/doctor.js';
import { runBuild } from './agents/build.js';
import { explainConfig, generateConfig } from './agents/config.js';
import { runCalamaresAssistant } from './agents/calamares.js';
import { askQuestion } from './agents/ask.js';
import { runWardrobeAssistant } from './agents/wardrobe.js';
import { inspectSystem, formatSystemInfo } from './tools/system-inspect.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };

// Load user config (registers custom providers, sets default)
const userConfig = loadUserConfig();

const BANNER = `
${chalk.cyan('╔═══════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.white('Eggs-AI')} ${chalk.dim('— Penguins-Eggs AI Agent')}  ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.dim(`v${pkg.version}`)}                            ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════╝')}
`;

function getProvider(opts: { provider?: string; model?: string; apiKey?: string; baseUrl?: string }): LLMProvider {
  // Priority: CLI flag > config file default > auto-detect
  const providerName = opts.provider || userConfig.defaultProvider;

  if (providerName) {
    const config: ProviderConfig = {
      provider: providerName,
      apiKey: opts.apiKey,
      model: opts.model,
      baseUrl: opts.baseUrl,
    };
    return createProvider(config);
  }
  return autoDetectProvider();
}

async function withSpinner<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const spinner = ora(label).start();
  try {
    const result = await fn();
    spinner.succeed();
    return result;
  } catch (err) {
    spinner.fail();
    throw err;
  }
}

const program = new Command();

program
  .name('eggs-ai')
  .description('AI agent for Penguins-Eggs — diagnostics, guided builds, config help, and Q&A')
  .version(pkg.version)
  .option('--provider <name>', 'LLM provider (run "providers list" to see all)')
  .option('--model <name>', 'Model name override')
  .option('--api-key <key>', 'API key (or set via env var per provider)')
  .option('--base-url <url>', 'Custom API base URL');

// ─── doctor ───────────────────────────────────────────────
program
  .command('doctor')
  .description('Diagnose system issues related to penguins-eggs')
  .argument('[complaint]', 'Describe the problem you are experiencing')
  .action(async (complaint: string | undefined) => {
    console.log(BANNER);
    const opts = program.opts();
    const provider = getProvider(opts);

    console.log(chalk.dim('Provider: ' + provider.name));
    console.log(chalk.yellow('\n🔍 Inspecting system...\n'));

    const info = inspectSystem();
    console.log(chalk.dim(formatSystemInfo(info)));
    console.log();

    const result = await withSpinner('Analyzing with AI...', () =>
      runDoctor(provider, complaint),
    );
    console.log('\n' + result);
  });

// ─── build ────────────────────────────────────────────────
program
  .command('build')
  .description('AI-guided ISO build with penguins-eggs')
  .option('-d, --desktop <name>', 'Desktop environment (xfce, gnome, kde, none)')
  .option('-i, --installer <type>', 'Installer: calamares, krill, none')
  .option('-c, --compression <level>', 'Compression: fast, standard, max')
  .option('-p, --prefix <name>', 'ISO filename prefix')
  .option('-b, --basename <name>', 'ISO basename')
  .option('--clone', 'Clone mode (include user data)')
  .option('--release', 'Release mode (strip eggs/calamares)')
  .option('--dry-run', 'Show plan without executing')
  .option('--describe <text>', 'Describe what you want in plain English')
  .action(async (cmdOpts) => {
    console.log(BANNER);
    const opts = program.opts();
    const provider = getProvider(opts);

    console.log(chalk.dim('Provider: ' + provider.name));

    const result = await withSpinner('Generating build plan...', () =>
      runBuild(provider, {
        desktop: cmdOpts.desktop,
        installer: cmdOpts.installer,
        compression: cmdOpts.compression,
        prefix: cmdOpts.prefix,
        basename: cmdOpts.basename,
        clone: cmdOpts.clone,
        release: cmdOpts.release,
        dryRun: cmdOpts.dryRun,
        description: cmdOpts.describe,
      }),
    );
    console.log('\n' + result);
  });

// ─── config ───────────────────────────────────────────────
const configCmd = program
  .command('config')
  .description('Explain or generate eggs configuration');

configCmd
  .command('explain')
  .description('Explain the current eggs.yaml configuration')
  .action(async () => {
    console.log(BANNER);
    const opts = program.opts();
    const provider = getProvider(opts);

    const result = await withSpinner('Analyzing configuration...', () =>
      explainConfig(provider),
    );
    console.log('\n' + result);
  });

configCmd
  .command('generate')
  .description('Generate an eggs.yaml for a specific purpose')
  .argument('<purpose>', 'Describe the purpose (e.g., "minimal rescue ISO", "full desktop for students")')
  .action(async (purpose: string) => {
    console.log(BANNER);
    const opts = program.opts();
    const provider = getProvider(opts);

    const result = await withSpinner('Generating configuration...', () =>
      generateConfig(provider, purpose),
    );
    console.log('\n' + result);
  });

// ─── calamares ────────────────────────────────────────────
program
  .command('calamares')
  .description('Calamares installer assistant')
  .argument('[question]', 'Ask about Calamares configuration')
  .action(async (question: string | undefined) => {
    console.log(BANNER);
    const opts = program.opts();
    const provider = getProvider(opts);

    const result = await withSpinner('Analyzing Calamares...', () =>
      runCalamaresAssistant(provider, question),
    );
    console.log('\n' + result);
  });

// ─── wardrobe ─────────────────────────────────────────────
program
  .command('wardrobe')
  .description('Wardrobe/costume system assistant')
  .argument('[question]', 'Ask about costumes and customization')
  .action(async (question: string | undefined) => {
    console.log(BANNER);
    const opts = program.opts();
    const provider = getProvider(opts);

    const result = await withSpinner('Consulting wardrobe...', () =>
      runWardrobeAssistant(provider, question),
    );
    console.log('\n' + result);
  });

// ─── ask (general Q&A) ───────────────────────────────────
program
  .command('ask')
  .description('Ask any question about penguins-eggs')
  .argument('<question>', 'Your question')
  .action(async (question: string) => {
    console.log(BANNER);
    const opts = program.opts();
    const provider = getProvider(opts);

    const result = await withSpinner('Thinking...', () =>
      askQuestion(provider, question),
    );
    console.log('\n' + result);
  });

// ─── status ───────────────────────────────────────────────
program
  .command('status')
  .description('Show system status (no AI required)')
  .action(() => {
    console.log(BANNER);
    const info = inspectSystem();
    console.log(formatSystemInfo(info));
  });

// ─── mcp (Model Context Protocol server) ─────────────────
program
  .command('mcp')
  .description('Start MCP server over stdio (for AI agent integration)')
  .action(async () => {
    // MCP runs over stdio — no banner, no console output
    await import('./mcp/server.js');
  });

// ─── serve (HTTP API for eggs-gui integration) ───────────
program
  .command('serve')
  .description('Start the HTTP API server (for eggs-gui integration)')
  .option('-p, --port <number>', 'Port to listen on', '3737')
  .option('--host <address>', 'Host to bind to', '127.0.0.1')
  .action(async (cmdOpts) => {
    console.log(BANNER);
    const { startServer } = await import('./server/api.js');
    startServer(parseInt(cmdOpts.port, 10), cmdOpts.host);
  });

// ─── providers ────────────────────────────────────────────
const providersCmd = program
  .command('providers')
  .description('List and manage LLM providers');

providersCmd
  .command('list')
  .description('List all registered LLM providers')
  .action(() => {
    console.log(BANNER);
    const names = ProviderRegistry.listNames();
    console.log(chalk.bold('Registered providers:\n'));
    for (const name of names) {
      console.log(`  ${chalk.cyan(name)}`);
    }
    console.log();
    if (userConfig.configPath) {
      console.log(chalk.dim(`Config loaded from: ${userConfig.configPath}`));
    } else {
      console.log(chalk.dim('No config file found. Create ~/.eggs-ai.yaml to add custom providers.'));
    }
    if (userConfig.defaultProvider) {
      console.log(chalk.dim(`Default provider: ${userConfig.defaultProvider}`));
    }
    console.log();
    console.log(chalk.dim('Use --provider <name> to select one, or set default_provider in config.'));
  });

providersCmd
  .command('init')
  .description('Create a sample ~/.eggs-ai.yaml config file')
  .action(async () => {
    console.log(BANNER);
    const { existsSync, writeFileSync } = await import('node:fs');
    const { homedir } = await import('node:os');
    const { join } = await import('node:path');

    const configPath = join(homedir(), '.eggs-ai.yaml');
    if (existsSync(configPath)) {
      console.log(chalk.yellow(`Config already exists at ${configPath}`));
      return;
    }

    const sample = `# Eggs-AI configuration
# Docs: https://github.com/eggs-ai

# Default provider (used when --provider is not specified)
# default_provider: gemini

# Custom provider definitions
# Each entry registers a new provider name you can use with --provider
providers:
  # Example: DeepSeek API
  # - name: deepseek
  #   type: custom
  #   baseUrl: https://api.deepseek.com/v1
  #   envKey: DEEPSEEK_API_KEY
  #   model: deepseek-chat

  # Example: Local LM Studio
  # - name: lmstudio
  #   type: custom
  #   baseUrl: http://localhost:1234/v1
  #   model: local-model

  # Example: Together AI
  # - name: together
  #   type: custom
  #   baseUrl: https://api.together.xyz/v1
  #   envKey: TOGETHER_API_KEY
  #   model: meta-llama/Llama-3-70b-chat-hf

  # Example: Fireworks AI
  # - name: fireworks
  #   type: custom
  #   baseUrl: https://api.fireworks.ai/inference/v1
  #   envKey: FIREWORKS_API_KEY
  #   model: accounts/fireworks/models/llama-v3p1-70b-instruct

  # Example: Perplexity
  # - name: perplexity
  #   type: custom
  #   baseUrl: https://api.perplexity.ai
  #   envKey: PERPLEXITY_API_KEY
  #   model: llama-3.1-sonar-large-128k-online

  # Example: OpenAI with a specific model preset
  # - name: gpt4
  #   type: openai
  #   model: gpt-4o
  #   envKey: OPENAI_API_KEY

  # Example: Anthropic with a specific model preset
  # - name: claude
  #   type: anthropic
  #   model: claude-sonnet-4-20250514
  #   envKey: ANTHROPIC_API_KEY
`;

    writeFileSync(configPath, sample, 'utf-8');
    console.log(chalk.green(`Created sample config at ${configPath}`));
    console.log(chalk.dim('Edit it to add your providers, then use --provider <name>.'));
  });

// ─── update (refresh knowledge cache) ─────────────────────
program
  .command('update')
  .description('Fetch latest penguins-eggs data from GitHub (issues, releases, README)')
  .option('--clear', 'Clear cache before fetching')
  .action(async (cmdOpts) => {
    console.log(BANNER);
    const { fetchRecentIssues, fetchLatestRelease, fetchReadme, clearCache } = await import('./knowledge/updater.js');

    if (cmdOpts.clear) {
      clearCache();
      console.log(chalk.dim('Cache cleared.'));
    }

    const spinner = ora('Fetching latest data from GitHub...').start();
    try {
      const [issues, release, readme] = await Promise.all([
        fetchRecentIssues(0), // TTL=0 forces refresh
        fetchLatestRelease(0),
        fetchReadme(0),
      ]);

      spinner.succeed('Knowledge base updated.');
      console.log();

      if (release) {
        console.log(chalk.bold(`Latest release: ${release.version}`) + chalk.dim(` (${release.publishedAt})`));
      }
      console.log(chalk.dim(`Recent issues fetched: ${issues.length}`));
      console.log(chalk.dim(`README cached: ${readme ? 'yes' : 'no'}`));
    } catch (err) {
      spinner.fail('Failed to fetch data.');
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    }
  });

// ─── interactive chat (with session persistence) ──────────
program
  .command('chat')
  .description('Interactive chat with session persistence and optional agentic mode')
  .option('--resume [sessionId]', 'Resume a previous session ("latest" for most recent)')
  .option('--agentic', 'Enable agentic mode with tool use')
  .action(async (cmdOpts) => {
    console.log(BANNER);
    console.log(chalk.dim('Interactive mode. Type "exit" or "quit" to leave.\n'));

    const opts = program.opts();
    const provider = getProvider(opts);
    console.log(chalk.dim('Provider: ' + provider.name + '\n'));

    const { runAgentLoop, sessionStore, InMemoryEventBus, SessionLogSubscriber, MetricsSubscriber, loadProfileBrief } = await import('./engine/index.js');
    const { default: inquirer } = await import('inquirer');

    const bus = new InMemoryEventBus<import('./engine/index.js').AgentEvent>();
    const sessionLog = new SessionLogSubscriber();
    const metrics = new MetricsSubscriber();
    bus.subscribe((e) => { sessionLog.handle(e).catch(() => {}); });
    bus.subscribe((e) => { metrics.handle(e).catch(() => {}); });

    const profileBrief = await loadProfileBrief();
    if (profileBrief) console.log(chalk.dim('User profile loaded.\n'));

    const useAgentic = cmdOpts.agentic ?? false;
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (cmdOpts.resume) {
      try {
        const targetId = cmdOpts.resume === true || cmdOpts.resume === 'latest'
          ? await sessionStore.findLatest() : cmdOpts.resume;
        if (targetId) {
          const session = await sessionStore.restore(targetId);
          if (session) {
            for (const msg of session.messages) {
              if (msg.role === 'user' || msg.role === 'assistant') history.push({ role: msg.role, content: msg.content });
            }
            console.log(chalk.green(`Resumed session: ${targetId} (${history.length} messages)\n`));
          } else { console.log(chalk.yellow('No previous session found. Starting fresh.\n')); }
        }
      } catch (err) { console.log(chalk.yellow(`Could not resume: ${err instanceof Error ? err.message : err}\n`)); }
    }

    while (true) {
      const { question } = await inquirer.prompt<{ question: string }>([
        { type: 'input', name: 'question', message: chalk.cyan('eggs-ai>'), validate: (input: string) => input.trim().length > 0 || 'Please enter a question' },
      ]);
      if (['exit', 'quit', 'q'].includes(question.toLowerCase().trim())) { console.log(chalk.dim('\nGoodbye!')); break; }

      try {
        let answer: string;
        if (useAgentic) {
          answer = await runAgentLoop(provider, question, {
            bus, maxSteps: 10,
            onEvent: (event) => {
              if (event.type === 'tool_call') console.log(chalk.dim(`  [tool] ${event.tool}(${JSON.stringify(event.input).slice(0, 80)})`));
              if (event.type === 'tool_result') console.log(chalk.dim(`  [result] ${event.ok ? 'ok' : 'error'}: ${event.output.slice(0, 100)}`));
            },
          });
        } else {
          answer = await withSpinner('Thinking...', () => askQuestion(provider, question, history));
        }
        console.log('\n' + answer + '\n');
        history.push({ role: 'user', content: question });
        history.push({ role: 'assistant', content: answer });
        if (history.length > 20) history.splice(0, 2);
      } catch (err) { console.error(chalk.red(`\nError: ${err instanceof Error ? err.message : err}\n`)); }
    }
    await sessionLog.flush();
    await metrics.flush();
  });

// ─── agent (autonomous mode) ─────────────────────────────
program
  .command('agent')
  .description('Run an autonomous agent task with multi-step tool use (powered by myclaw engine)')
  .argument('<task>', 'Task description in plain English')
  .option('--max-steps <n>', 'Maximum tool-use steps', '10')
  .option('--dry-run', 'Show tool calls without executing destructive commands')
  .action(async (task: string, cmdOpts) => {
    console.log(BANNER);
    const opts = program.opts();
    const provider = getProvider(opts);
    console.log(chalk.dim('Provider: ' + provider.name));
    console.log(chalk.dim(`Mode: autonomous agent (max ${cmdOpts.maxSteps} steps)\n`));

    const { runAgentLoop, InMemoryEventBus, SessionLogSubscriber, MetricsSubscriber, checkGate, loadProfileBrief } = await import('./engine/index.js');

    const bus = new InMemoryEventBus<import('./engine/index.js').AgentEvent>();
    const sessionLog = new SessionLogSubscriber();
    const metricsSubscriber = new MetricsSubscriber();
    bus.subscribe((e) => { sessionLog.handle(e).catch(() => {}); });
    bus.subscribe((e) => { metricsSubscriber.handle(e).catch(() => {}); });

    if (cmdOpts.dryRun) {
      checkGate.setApprovalCallback(({ command, reason }) => {
        console.log(chalk.yellow(`  [dry-run] Would execute: ${command}`));
        console.log(chalk.yellow(`  [dry-run] Reason: ${reason}`));
        return false;
      });
    } else {
      const { default: inquirer } = await import('inquirer');
      checkGate.setApprovalCallback(async ({ command, reason }) => {
        console.log(chalk.yellow(`\n  Destructive command: ${command}`));
        console.log(chalk.yellow(`  Reason: ${reason}`));
        const { approved } = await inquirer.prompt<{ approved: boolean }>([
          { type: 'confirm', name: 'approved', message: 'Allow this command?', default: false },
        ]);
        return approved;
      });
    }

    const profileBrief = await loadProfileBrief();
    const profileCtx = profileBrief ? `\n\nUser profile:\n${profileBrief}` : '';

    const result = await runAgentLoop(provider, task + profileCtx, {
      bus, maxSteps: parseInt(cmdOpts.maxSteps, 10),
      onEvent: (event) => {
        if (event.type === 'start') console.log(chalk.dim(`[step ${event.step}] Starting agent loop...`));
        if (event.type === 'tool_call') console.log(chalk.cyan(`[step ${event.step}] ${event.tool}(${JSON.stringify(event.input).slice(0, 100)})`));
        if (event.type === 'tool_result') console.log(chalk.dim(`  -> ${event.ok ? 'ok' : 'error'}: ${event.output.slice(0, 200)}`));
        if (event.type === 'error') console.log(chalk.red(`[step ${event.step}] Error: ${event.error}`));
        if (event.type === 'max_steps') console.log(chalk.yellow(`\nReached max steps (${event.step}). Generating final answer...`));
      },
    });

    console.log('\n' + chalk.bold('Result:'));
    console.log(result);
    await sessionLog.flush();
    await metricsSubscriber.flush();
  });

program.parse();
