/**
 * plugins/build-infra/erofs-compress/produce-hook.ts
 *
 * Pre/post hooks for eggs produce that replace mksquashfs with mkfs.erofs.
 *
 * Usage in ovary.d/produce.ts:
 *   import { erofsCompress } from './integrations/erofs-produce-hook.js'
 *
 *   // Replace the mksquashfs call:
 *   const result = await erofsCompress(rootfsDir, outputPath, exec, verbose)
 */

import { ErofsCompress, ErofsOptions, ErofsResult } from './erofs-compress.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

/**
 * Compress the live rootfs directory using EROFS instead of SquashFS.
 * Returns compression statistics.
 */
export async function erofsCompress(
  rootfsDir: string,
  outputPath: string,
  exec: ExecFn,
  verbose: boolean,
  opts: ErofsOptions = {}
): Promise<ErofsResult> {
  const erofs = new ErofsCompress(exec, verbose, opts)

  if (!(await erofs.isAvailable())) {
    throw new Error(
      'mkfs.erofs not found. Install erofs-utils before using the EROFS compression backend.'
    )
  }

  const kernelOk = await erofs.isKernelSupported()
  if (!kernelOk) {
    console.warn('EROFS: kernel may not support EROFS (requires >= 5.4). Proceeding anyway.')
  }

  const result = await erofs.compress(rootfsDir, outputPath)

  const ratio = result.compressionRatio.toFixed(2)
  const inputMib = (result.inputSizeBytes / 1024 / 1024).toFixed(0)
  const outputMib = (result.outputSizeBytes / 1024 / 1024).toFixed(0)
  const secs = (result.durationMs / 1000).toFixed(1)

  console.log(`EROFS: ${inputMib} MiB → ${outputMib} MiB (${ratio}x) in ${secs}s`)
  console.log(`EROFS: SHA-256: ${result.checksumSha256.slice(0, 16)}...`)

  return result
}

/**
 * Verify an EROFS image after production.
 */
export async function erofsVerify(
  imagePath: string,
  exec: ExecFn,
  verbose: boolean
): Promise<boolean> {
  const erofs = new ErofsCompress(exec, verbose)
  const ok = await erofs.verify(imagePath)
  if (ok) {
    console.log(`EROFS: fsck passed: ${imagePath}`)
  } else {
    console.error(`EROFS: fsck FAILED: ${imagePath}`)
  }
  return ok
}
