/**
 * plugins/distribution/lfs-tracker/produce-hook.ts
 * Post-produce hook that integrates with the Ovary.produce() flow.
 *
 * Usage: Call `afterProduce()` at the end of ovary.d/produce.ts,
 * after makeIso() completes, to auto-track the ISO in git-lfs.
 *
 * Example patch to ovary.d/produce.ts:
 *
 *   import { afterProduce } from '../../lib/integrations/produce-hook.js'
 *   // ... at the end of produce():
 *   await afterProduce(this.settings.isoFilename, this.settings.config.snapshot_dir, verbose)
 */

import { loadLfsConfig } from './lfs-config.js'
import { LfsTracker } from './lfs-tracker.js'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export async function afterProduce(
  isoFilename: string,
  snapshotDir: string,
  verbose: boolean,
  execFn: ExecFn
): Promise<void> {
  const config = loadLfsConfig()
  if (!config.enabled) return

  const tracker = new LfsTracker(execFn, verbose)
  if (!(await tracker.isAvailable())) {
    if (verbose) {
      console.log('git-lfs not installed, skipping LFS tracking')
    }
    return
  }

  const isoPath = path.join(snapshotDir, isoFilename)
  if (verbose) {
    console.log(`LFS: tracking ${isoPath}`)
  }

  const result = await tracker.track(isoPath)
  if (result.committed) {
    console.log(`LFS: committed ${isoFilename}`)
    if (result.pushed) {
      console.log(`LFS: pushed to remote`)
    }
  }
}
