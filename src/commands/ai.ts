/**
 * src/commands/ai.ts
 * penguins-eggs — eggs ai command
 *
 * Entry point for the eggs-ai assistant. Delegates to the eggs-ai CLI
 * (installed at /usr/local/bin/eggs-ai or built from integrations/eggs-ai/).
 * Also provides install, serve (HTTP API), and mcp (MCP server) sub-actions.
 */

import { Command, Flags } from '@oclif/core'
import { spawnSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'

export default class Ai extends Command {
  static summary = 'AI assistant for penguins-eggs (powered by eggs-ai)'

  static description = `
Delegates to the eggs-ai assistant. Understands all eggs commands,
configurations, and workflows. Provides diagnostics, guided ISO building,
config generation, and Calamares assistance.

Supported LLM providers: Gemini, OpenAI, Anthropic, Mistral, Groq,
Ollama (local), or any OpenAI-compatible endpoint.

Sub-commands passed through to eggs-ai:
  doctor          Diagnose the current eggs environment
  ask <question>  Ask a one-shot question
  chat            Interactive chat session
  build           Guided ISO build plan
  config explain  Explain the current eggs configuration
  config generate Generate a configuration for a target distro
  calamares       Calamares installer assistance
  serve           Start the HTTP API server (port 3737)
  mcp             Start the MCP server (for Cursor, Claude Desktop, etc.)
  providers init  Generate ~/.eggs-ai.yaml with provider configuration
  providers list  List configured providers

Run \`eggs ai install\` to install eggs-ai on this system.
Run \`eggs ai serve\` to start the HTTP API (used by eggs-gui web frontend).
Run \`eggs ai mcp\` to start the MCP server.
`

  static examples = [
    'eggs ai doctor                          # diagnose eggs environment',
    'eggs ai ask "how do I produce a naked ISO?"',
    'eggs ai chat                            # interactive session',
    'eggs ai build                           # guided ISO build plan',
    'eggs ai config explain                  # explain current config',
    'eggs ai serve                           # start HTTP API on port 3737',
    'eggs ai mcp                             # start MCP server',
    'eggs ai install                         # install eggs-ai on this system',
    'eggs ai providers init                  # set up LLM provider config',
  ]

  static strict = false  // pass all remaining args through to eggs-ai

  static flags = {
    install: Flags.boolean({ description: 'install eggs-ai on this system' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose output' }),
  }

  static args = [
    { name: 'subcommand', description: 'eggs-ai subcommand and arguments', required: false },
  ]

  private readonly aiCandidates = [
    '/usr/local/bin/eggs-ai',
    '/usr/bin/eggs-ai',
    '/opt/eggs-ai/bin/eggs-ai.js',
    path.resolve(__dirname, '../../integrations/eggs-ai/bin/eggs-ai.js'),
    path.resolve(__dirname, '../../eggs-ai/bin/eggs-ai.js'),
  ]

  private readonly aiRoot = path.resolve(__dirname, '../../integrations/eggs-ai')

  private findAiBin(): string | null {
    for (const c of this.aiCandidates) {
      if (fs.existsSync(c)) return c
    }
    return null
  }

  private async install(verbose: boolean): Promise<void> {
    // Use the upstream install.sh if available, otherwise npm install + build
    const installScript = path.join(this.aiRoot, 'install.sh')

    if (fs.existsSync(installScript)) {
      console.log(chalk.yellow('Installing eggs-ai via install.sh...'))
      const result = spawnSync('bash', [installScript], {
        stdio: verbose ? 'inherit' : 'pipe',
        env: { ...process.env, INSTALL_DIR: '/opt/eggs-ai', BIN_LINK: '/usr/local/bin/eggs-ai' },
      })
      if (result.status !== 0) {
        const stderr = result.stderr?.toString().trim() ?? ''
        this.error(`eggs-ai installation failed${stderr ? ': ' + stderr : ''}`, { exit: 1 })
      }
    } else if (fs.existsSync(this.aiRoot)) {
      // Fall back: npm install + build in-place
      console.log(chalk.yellow('Building eggs-ai from source...'))
      spawnSync('npm', ['install'], { cwd: this.aiRoot, stdio: verbose ? 'inherit' : 'pipe' })
      spawnSync('npm', ['run', 'build'], { cwd: this.aiRoot, stdio: verbose ? 'inherit' : 'pipe' })
      // Symlink the bin
      const binSrc = path.join(this.aiRoot, 'bin/eggs-ai.js')
      const binDst = '/usr/local/bin/eggs-ai'
      if (fs.existsSync(binSrc) && !fs.existsSync(binDst)) {
        fs.symlinkSync(binSrc, binDst)
      }
    } else {
      this.error(
        'eggs-ai source not found. Clone https://github.com/Interested-Deving-1896/eggs-ai or run eggs from the all-features branch.',
        { exit: 1 },
      )
    }

    // Install systemd service for the HTTP API
    const serviceContent = `[Unit]
Description=eggs-ai HTTP API server (port 3737)
After=network.target
Documentation=https://github.com/Interested-Deving-1896/eggs-ai

[Service]
Type=simple
ExecStart=/usr/local/bin/eggs-ai serve
Restart=on-failure
RestartSec=5
Environment=EGGS_AI_PORT=3737

[Install]
WantedBy=multi-user.target
`
    const servicePath = '/etc/systemd/system/eggs-ai.service'
    if (!fs.existsSync(servicePath)) {
      try {
        fs.writeFileSync(servicePath, serviceContent)
        spawnSync('systemctl', ['daemon-reload'], { stdio: 'pipe' })
        console.log(chalk.green('systemd service installed: eggs-ai.service'))
        console.log(chalk.dim('Enable with: sudo systemctl enable --now eggs-ai'))
      } catch {
        // Non-fatal: systemd may not be available
      }
    }

    console.log(chalk.green('eggs-ai installed successfully.'))
    console.log(chalk.dim('Configure providers: eggs ai providers init'))
  }

  async run(): Promise<void> {
    const { flags, argv } = await this.parse(Ai)
    const verbose = flags.verbose ?? false

    // ── Install ───────────────────────────────────────────────────────────
    if (flags.install) {
      await this.install(verbose)
      return
    }

    // ── Find eggs-ai binary ───────────────────────────────────────────────
    let aiBin = this.findAiBin()

    if (!aiBin) {
      console.log(chalk.yellow('eggs-ai is not installed.'))
      console.log(chalk.dim('Installing now...'))
      await this.install(verbose)
      aiBin = this.findAiBin()
      if (!aiBin) {
        this.error('eggs-ai installation succeeded but binary not found. Check PATH.', { exit: 1 })
      }
    }

    // ── Pass through all args to eggs-ai ──────────────────────────────────
    // Strip our own flags (--install, --verbose) from argv before passing through
    const passthrough = (argv as string[]).filter(
      (a) => a !== '--install' && a !== '--verbose' && a !== '-v',
    )

    // Determine how to invoke: node script or direct binary
    const isScript = aiBin.endsWith('.js')
    const cmd = isScript ? 'node' : aiBin
    const args = isScript ? [aiBin, ...passthrough] : passthrough

    const result = spawnSync(cmd, args, { stdio: 'inherit' })
    if (result.status !== null && result.status !== 0) {
      this.exit(result.status)
    }
  }
}
