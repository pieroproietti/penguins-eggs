/**
 * src/lib/plugin-loader.ts
 *
 * Discovers and runs shell plugin scripts installed by ecosystem tools
 * (penguins-kernel-manager, penguins-powerwash, penguins-immutable-framework).
 *
 * Plugin contract:
 *   - Scripts live in PLUGIN_DIR (default: /usr/share/penguins-eggs/plugins/)
 *   - Each script is called with EGGS_HOOK set to the current hook point
 *   - Additional context is passed via environment variables
 *   - A non-zero exit code is logged as a warning but never aborts eggs
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/** Hook points that eggs fires. */
export type EggsHook =
  | 'produce'          // eggs produce — ISO assembly complete, pre-post-hooks
  | 'update'           // eggs update — before updating eggs itself
  | 'kernel-changed'   // notified by penguins-kernel-manager post-install
  | 'pif-upgraded'     // notified by penguins-immutable-framework post-upgrade
  | 'pif-mutable-enter'// notified by pif when entering mutable mode
  | 'pif-mutable-exit' // notified by pif when exiting mutable mode

/** Context passed to each plugin as environment variables. */
export interface PluginContext {
  hook: EggsHook
  isoRoot?: string    // EGGS_ISO_ROOT — live filesystem root (/ pre-produce, liveroot post-produce)
  workDir?: string    // EGGS_WORK     — working directory for ISO assembly (snapshot_dir)
  isoFile?: string    // EGGS_ISO_FILE — final ISO path
  isoMnt?: string     // EGGS_ISO_MNT  — ISO staging tree (snapshot_dir/mnt/iso); squashfs at live/filesystem.squashfs
  [key: string]: string | undefined
}

const DEFAULT_PLUGIN_DIR = '/usr/share/penguins-eggs/plugins'

/**
 * Run all plugin scripts for the given hook point.
 *
 * Plugins are executed sequentially in lexicographic order.
 * Failures are logged but never propagate — plugins are best-effort.
 */
export async function runPlugins(
  ctx: PluginContext,
  pluginDir: string = DEFAULT_PLUGIN_DIR,
  verbose = false,
): Promise<void> {
  if (!fs.existsSync(pluginDir)) {
    if (verbose) console.log(`[plugins] directory not found: ${pluginDir} — skipping`)
    return
  }

  const scripts = fs
    .readdirSync(pluginDir)
    .filter((f) => f.endsWith('.sh'))
    .sort()

  if (scripts.length === 0) {
    if (verbose) console.log(`[plugins] no plugins found in ${pluginDir}`)
    return
  }

  // Build the environment for all plugins
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    EGGS_HOOK: ctx.hook,
    EGGS_ISO_ROOT: ctx.isoRoot ?? '',
    EGGS_WORK: ctx.workDir ?? '',
    EGGS_ISO_FILE: ctx.isoFile ?? '',
    EGGS_ISO_MNT: ctx.isoMnt ?? '',
  }
  // Forward any extra context keys
  for (const [k, v] of Object.entries(ctx)) {
    if (!['hook', 'isoRoot', 'workDir', 'isoFile', 'isoMnt'].includes(k) && v !== undefined) {
      env[k.toUpperCase()] = v
    }
  }

  for (const script of scripts) {
    const scriptPath = path.join(pluginDir, script)
    if (verbose) console.log(`[plugins] running ${script} (hook=${ctx.hook})`)

    const result = spawnSync('bash', [scriptPath], {
      env,
      stdio: verbose ? 'inherit' : 'pipe',
      timeout: 30_000,
    })

    if (result.status !== 0) {
      const stderr = result.stderr?.toString().trim() ?? ''
      console.warn(
        `[plugins] ${script} exited with code ${result.status}${stderr ? ': ' + stderr : ''}`,
      )
    } else if (verbose) {
      console.log(`[plugins] ${script} OK`)
    }
  }
}
