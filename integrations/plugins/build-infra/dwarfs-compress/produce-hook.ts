/**
 * plugins/build-infra/dwarfs-compress/produce-hook.ts
 *
 * Pre/post hooks for eggs produce that replace mksquashfs with mkdwarfs.
 *
 * Usage in ovary.d/produce.ts:
 *   import { dwarfsCompress } from './integrations/dwarfs-produce-hook.js'
 *
 *   // Replace the mksquashfs call:
 *   const result = await dwarfsCompress(rootfsDir, outputPath, exec, verbose)
 */

import { DwarfsCompress, DwarfsOptions, DwarfsResult } from './dwarfs-compress.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

/**
 * Compress the live rootfs directory using DwarFS instead of SquashFS.
 * Returns compression statistics.
 */
export async function dwarfsCompress(
  rootfsDir: string,
  outputPath: string,
  exec: ExecFn,
  verbose: boolean,
  opts: DwarfsOptions = {}
): Promise<DwarfsResult> {
  const dwarfs = new DwarfsCompress(exec, verbose, opts)

  if (!(await dwarfs.isMkdwarfsAvailable())) {
    console.log('DwarFS not found on PATH. Downloading static binary...')
  }

  const result = await dwarfs.compress(rootfsDir, outputPath)

  const ratio = result.compressionRatio.toFixed(2)
  const inputMib = (result.inputSizeBytes / 1024 / 1024).toFixed(0)
  const outputMib = (result.outputSizeBytes / 1024 / 1024).toFixed(0)
  const secs = (result.durationMs / 1000).toFixed(1)

  console.log(`DwarFS: ${inputMib} MiB → ${outputMib} MiB (${ratio}x) in ${secs}s`)
  console.log(`DwarFS: SHA-512: ${result.checksumSha512.slice(0, 16)}...`)

  return result
}

/**
 * Verify a DwarFS image after production.
 */
export async function dwarfsVerify(
  imagePath: string,
  exec: ExecFn,
  verbose: boolean
): Promise<boolean> {
  const dwarfs = new DwarfsCompress(exec, verbose)
  const ok = await dwarfs.verify(imagePath)
  if (ok) {
    console.log(`DwarFS: integrity check passed: ${imagePath}`)
  } else {
    console.error(`DwarFS: integrity check FAILED: ${imagePath}`)
  }
  return ok
}
