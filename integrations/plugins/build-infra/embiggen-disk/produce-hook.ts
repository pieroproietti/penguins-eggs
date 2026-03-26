/**
 * plugins/build-infra/embiggen-disk/produce-hook.ts
 *
 * Post-install hook: expand the root partition to fill available disk space
 * after eggs installs a system to disk.
 *
 * Usage in the eggs installer (krill/calamares post-install):
 *   import { embiggenAfterInstall } from './integrations/embiggen-hook.js'
 *   await embiggenAfterInstall('/dev/sda1', exec, verbose)
 */

import { EmbiggenDisk, EmbiggenOptions } from './embiggen-disk.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

/**
 * Expand the installed root partition to fill available disk space.
 * Safe to call even if the disk is already fully allocated — embiggen-disk
 * is a no-op when there is nothing to expand.
 *
 * @param rootDevice  Root partition device (e.g. '/dev/sda1')
 */
export async function embiggenAfterInstall(
  rootDevice: string,
  exec: ExecFn,
  verbose: boolean,
  opts: EmbiggenOptions = {}
): Promise<void> {
  const embiggen = new EmbiggenDisk(exec, verbose, opts)

  // Check for unallocated space first
  const diskDevice = rootDevice.replace(/\d+$/, '')
  const free = await embiggen.unallocatedSpace(diskDevice)

  if (free < 1024 * 1024) {
    if (verbose) console.log(`embiggen-disk: no significant unallocated space on ${diskDevice}, skipping`)
    return
  }

  const freeMib = (free / 1024 / 1024).toFixed(0)
  console.log(`embiggen-disk: ${freeMib} MiB unallocated on ${diskDevice}, expanding ${rootDevice}...`)

  const result = await embiggen.resize(rootDevice)
  if (result.success) {
    console.log(`embiggen-disk: ${rootDevice} expanded successfully`)
    if (verbose) console.log(result.output)
  } else {
    console.warn(`embiggen-disk: resize failed for ${rootDevice}:`)
    console.warn(result.output)
  }
}
