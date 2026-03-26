/**
 * plugins/build-infra/btrfs-compat/produce-hook.ts
 *
 * Pre-produce hook: validate Btrfs kernel compatibility before starting
 * a snapshot-assisted produce run.
 *
 * Usage in ovary.d/produce.ts (before btrfs-snapshot hooks):
 *   import { btrfsCompatCheck } from './integrations/btrfs-compat-hook.js'
 *   await btrfsCompatCheck(exec, verbose)
 */

import { BtrfsCompat } from './btrfs-compat.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

/**
 * Run a pre-produce Btrfs compatibility check.
 * Prints warnings but does not abort — snapshot operations degrade gracefully.
 */
export async function btrfsCompatCheck(exec: ExecFn, verbose: boolean): Promise<void> {
  const compat = new BtrfsCompat(exec, verbose)

  // Only relevant on Btrfs root
  const fsType = await exec('stat -f -c %T /', { capture: true })
  if (fsType.data.trim() !== 'btrfs') {
    if (verbose) console.log('btrfs-compat: root is not Btrfs, skipping compatibility check')
    return
  }

  const warnings = await compat.validateSnapshotSupport()
  if (warnings.length > 0) {
    for (const w of warnings) {
      console.warn(`btrfs-compat: ${w}`)
    }
  } else if (verbose) {
    const kv = await compat.getKernelVersion()
    console.log(`btrfs-compat: kernel ${kv.raw} — all snapshot features available`)
  }
}

/**
 * Print a full Btrfs feature compatibility report.
 */
export async function btrfsCompatReport(exec: ExecFn, verbose: boolean): Promise<void> {
  const compat = new BtrfsCompat(exec, verbose)
  const report = await compat.report()
  console.log(report)
}
