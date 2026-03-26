/**
 * plugins/build-infra/fuse-overlayfs/produce-hook.ts
 *
 * Wraps the eggs produce rootfs packing step with a fuse-overlayfs mount,
 * enabling rootless builds inside containers.
 *
 * Usage in ovary.d/produce.ts:
 *   import { withOverlayRootfs } from './integrations/fuse-overlayfs-hook.js'
 *
 *   await withOverlayRootfs(sourceRootfs, workDir, exec, verbose, async (mergedPath) => {
 *     await mksquashfs(mergedPath, outputIso)
 *   })
 */

import path from 'node:path'
import { FuseOverlayfs, FuseOverlayfsOptions } from './fuse-overlayfs.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

/**
 * Run a callback with the rootfs exposed through an overlay mount.
 * Automatically cleans up the mount on completion or error.
 *
 * When kernel overlayfs is available (root), uses it directly.
 * When running rootless, transparently uses fuse-overlayfs.
 */
export async function withOverlayRootfs(
  sourceRootfs: string,
  workDir: string,
  exec: ExecFn,
  verbose: boolean,
  callback: (mergedPath: string) => Promise<void>,
  opts: FuseOverlayfsOptions = {}
): Promise<void> {
  const fuse = new FuseOverlayfs(exec, verbose, opts)
  const { mergedPath, cleanup } = await fuse.wrapRootfs(sourceRootfs, workDir)

  try {
    await callback(mergedPath)
  } finally {
    await cleanup()
  }
}

/**
 * Check and report overlay availability for the current environment.
 * Useful for pre-flight checks before starting a long produce run.
 */
export async function checkOverlaySupport(
  exec: ExecFn,
  verbose: boolean
): Promise<{ kernelOverlay: boolean; fuseOverlay: boolean; devFuse: boolean }> {
  const fuse = new FuseOverlayfs(exec, verbose)
  const [kernelOverlay, fuseOverlay, devFuse] = await Promise.all([
    fuse.isKernelOverlayAvailable(),
    fuse.isFuseOverlayfsAvailable(),
    fuse.isDevFuseAvailable(),
  ])

  if (verbose) {
    console.log(`Overlay support:`)
    console.log(`  kernel overlayfs: ${kernelOverlay ? 'yes' : 'no'}`)
    console.log(`  fuse-overlayfs:   ${fuseOverlay ? 'yes' : 'no'}`)
    console.log(`  /dev/fuse:        ${devFuse ? 'yes' : 'no'}`)
  }

  return { kernelOverlay, fuseOverlay, devFuse }
}
