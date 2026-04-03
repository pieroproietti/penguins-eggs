/**
 * src/commands/gui.ts
 * penguins-eggs — eggs gui command
 *
 * Starts the eggs-gui daemon and launches the chosen frontend
 * (TUI, desktop, or web). The daemon exposes all eggs operations
 * over JSON-RPC on a Unix socket (/tmp/eggs-gui.sock).
 */

import { Command, Flags } from '@oclif/core'
import { spawnSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import chalk from 'chalk'

export default class Gui extends Command {
  static summary = 'Launch the eggs-gui frontend (TUI, desktop, or web)'

  static description = `
Starts the eggs-daemon JSON-RPC server and launches the chosen frontend.

The daemon listens on /tmp/eggs-gui.sock and exposes all penguins-eggs
operations (produce, install, wardrobe, config, calamares, etc.) to the
three available frontends:

  tui      BubbleTea terminal UI  — works over SSH, no display required
  desktop  NodeGUI Qt6 desktop    — requires a display (X11 or Wayland)
  web      NiceGUI browser UI     — opens http://localhost:7777

eggs-ai integration: if eggs-ai is running (port 3737), the GUI connects
to it automatically for AI-assisted diagnostics and build guidance.
`

  static examples = [
    'eggs gui                    # launch TUI (default)',
    'eggs gui --frontend=desktop # launch NodeGUI desktop',
    'eggs gui --frontend=web     # launch NiceGUI web UI (http://localhost:7777)',
    'eggs gui --daemon-only      # start daemon without launching a frontend',
    'eggs gui --stop             # stop the running daemon',
  ]

  static flags = {
    frontend: Flags.string({
      description: 'frontend to launch: tui, desktop, web (default: tui)',
      options: ['tui', 'desktop', 'web'],
      default: 'tui',
    }),
    'daemon-only': Flags.boolean({
      description: 'start the daemon without launching a frontend',
    }),
    stop: Flags.boolean({
      description: 'stop the running eggs-daemon',
    }),
    port: Flags.integer({
      description: 'port for the web frontend (default: 7777)',
      default: 7777,
    }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose output' }),
  }

  // Candidate locations for the eggs-gui binaries, in priority order.
  private readonly daemonCandidates = [
    '/usr/local/bin/eggs-daemon',
    '/usr/bin/eggs-daemon',
    path.resolve(__dirname, '../../integrations/eggs-gui/bin/eggs-daemon'),
  ]

  private readonly tuiCandidates = [
    '/usr/local/bin/eggs-tui',
    '/usr/bin/eggs-tui',
    path.resolve(__dirname, '../../integrations/eggs-gui/bin/eggs-tui'),
  ]

  private readonly guiRoot = path.resolve(__dirname, '../../integrations/eggs-gui')

  private findBin(candidates: string[]): string | null {
    for (const c of candidates) {
      if (fs.existsSync(c)) return c
    }
    return null
  }

  private isBuilt(candidates: string[]): boolean {
    return this.findBin(candidates) !== null
  }

  private isDaemonRunning(): boolean {
    const sock = '/tmp/eggs-gui.sock'
    if (!fs.existsSync(sock)) return false
    // Probe the Unix socket with a pure Node.js connect — no nc dependency,
    // works on Alpine (busybox nc), Arch, Debian, and all other distros.
    try {
      const client = net.createConnection(sock)
      // Synchronous probe: connect with a 300 ms timeout
      let connected = false
      client.on('connect', () => { connected = true; client.destroy() })
      client.on('error', () => { client.destroy() })
      // Block briefly using a spin-wait (acceptable for a CLI startup check)
      const deadline = Date.now() + 300
      while (Date.now() < deadline && !connected && !client.destroyed) {
        // Node event loop tick — let the connect/error event fire
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10)
      }
      return connected
    } catch {
      return false
    }
  }

  private async buildIfNeeded(verbose: boolean): Promise<void> {
    if (this.isBuilt(this.daemonCandidates) && this.isBuilt(this.tuiCandidates)) return

    if (!fs.existsSync(this.guiRoot)) {
      this.error(
        'eggs-gui source not found. Run: sudo ./integrations/eggs-gui/scripts/install-eggs-gui.sh',
        { exit: 1 },
      )
    }

    if (spawnSync('which', ['go'], { stdio: 'pipe' }).status !== 0) {
      this.error('Go is required to build eggs-gui. Install Go 1.21+ and retry.', { exit: 1 })
    }

    console.log(chalk.yellow('Building eggs-gui (first run)...'))
    const result = spawnSync('make', ['daemon', 'tui'], {
      cwd: this.guiRoot,
      stdio: verbose ? 'inherit' : 'pipe',
    })
    if (result.status !== 0) {
      this.error('Failed to build eggs-gui. Run `make daemon tui` in integrations/eggs-gui/ manually.', { exit: 1 })
    }
    console.log(chalk.green('eggs-gui built successfully.'))
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Gui)
    const verbose = flags.verbose ?? false

    // ── Stop ──────────────────────────────────────────────────────────────
    if (flags.stop) {
      const r = spawnSync('pkill', ['-f', 'eggs-daemon'], { stdio: 'pipe' })
      if (r.status === 0) {
        console.log(chalk.green('eggs-daemon stopped.'))
      } else {
        console.log(chalk.yellow('eggs-daemon was not running.'))
      }
      return
    }

    // ── Build if needed ───────────────────────────────────────────────────
    await this.buildIfNeeded(verbose)

    const daemonBin = this.findBin(this.daemonCandidates)!

    // ── Start daemon ──────────────────────────────────────────────────────
    if (!this.isDaemonRunning()) {
      console.log(chalk.dim('Starting eggs-daemon...'))
      const daemonEnv: NodeJS.ProcessEnv = { ...process.env }
      if (flags.frontend === 'web') {
        daemonEnv['EGGS_DAEMON_ADDR'] = `:${flags.port}`
      }
      const daemon = spawn(daemonBin, [], {
        detached: true,
        stdio: 'ignore',
        env: daemonEnv,
      })
      daemon.unref()

      // Wait up to 3 s for the socket to appear
      let waited = 0
      while (!this.isDaemonRunning() && waited < 3000) {
        await new Promise((r) => setTimeout(r, 200))
        waited += 200
      }
      if (!this.isDaemonRunning()) {
        this.error('eggs-daemon failed to start. Run it manually: eggs-daemon', { exit: 1 })
      }
      console.log(chalk.green('eggs-daemon started (/tmp/eggs-gui.sock)'))
    } else {
      console.log(chalk.dim('eggs-daemon already running.'))
    }

    if (flags['daemon-only']) return

    // ── Launch frontend ───────────────────────────────────────────────────
    switch (flags.frontend) {
      case 'tui': {
        const tuiBin = this.findBin(this.tuiCandidates)
        if (!tuiBin) {
          this.error('eggs-tui binary not found. Run `make tui` in integrations/eggs-gui/.', { exit: 1 })
        }
        console.log(chalk.dim('Launching eggs-tui...'))
        spawnSync(tuiBin, [], { stdio: 'inherit' })
        break
      }

      case 'desktop': {
        const desktopDir = path.join(this.guiRoot, 'desktop')
        if (!fs.existsSync(desktopDir)) {
          this.error('eggs-gui desktop source not found in integrations/eggs-gui/desktop/.', { exit: 1 })
        }
        // Build if dist/ doesn't exist
        if (!fs.existsSync(path.join(desktopDir, 'dist'))) {
          console.log(chalk.yellow('Building NodeGUI desktop (first run)...'))
          spawnSync('npm', ['install'], { cwd: desktopDir, stdio: verbose ? 'inherit' : 'pipe' })
          spawnSync('npm', ['run', 'build'], { cwd: desktopDir, stdio: verbose ? 'inherit' : 'pipe' })
        }
        console.log(chalk.dim('Launching eggs-gui desktop...'))
        spawnSync('npm', ['start'], { cwd: desktopDir, stdio: 'inherit' })
        break
      }

      case 'web': {
        const webDir = path.join(this.guiRoot, 'web')
        if (!fs.existsSync(webDir)) {
          this.error('eggs-gui web source not found in integrations/eggs-gui/web/.', { exit: 1 })
        }
        const python = spawnSync('which', ['python3'], { stdio: 'pipe' }).status === 0 ? 'python3' : 'python'
        console.log(chalk.green(`eggs-gui web UI starting at http://localhost:${flags.port}`))
        spawnSync(python, ['main.py'], {
          cwd: webDir,
          stdio: 'inherit',
          env: { ...process.env, EGGS_GUI_PORT: String(flags.port) },
        })
        break
      }
    }
  }
}
