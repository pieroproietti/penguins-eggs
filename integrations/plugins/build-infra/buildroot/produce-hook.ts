/**
 * plugins/build-infra/buildroot/produce-hook.ts
 *
 * Pre-produce hook: consume a Buildroot output directory as the eggs rootfs source.
 *
 * Usage in ovary.d/produce.ts:
 *   import { buildrootPrepareRootfs } from './integrations/buildroot-hook.js'
 *   const { path, isDirectory } = await buildrootPrepareRootfs(buildrootOutputDir, exec, verbose)
 *   // if isDirectory: pass path to mksquashfs/mkdwarfs/mkfs.erofs
 *   // if !isDirectory: path is already a squashfs/erofs image — use directly
 */

import { Buildroot, BuildrootConfig } from './buildroot.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

/**
 * Prepare a Buildroot output directory for use as eggs produce source.
 * Returns the path to the rootfs (directory or image file) and whether
 * it is a directory (needs compression) or already an image (use directly).
 */
export async function buildrootPrepareRootfs(
  buildrootDir: string,
  exec: ExecFn,
  verbose: boolean,
  config: Partial<BuildrootConfig> = {}
): Promise<{ path: string; isDirectory: boolean; format: string }> {
  const br = new Buildroot(exec, verbose, { buildrootDir, ...config })

  if (!br.isAvailable()) {
    throw new Error(`Buildroot source not found at: ${buildrootDir}`)
  }

  const ver = await br.version()
  if (verbose) console.log(`buildroot: version ${ver}`)

  console.log(`buildroot: consuming output from ${buildrootDir}...`)
  const { path: rootfsPath, isDirectory } = await br.prepareForEggs()

  const result = br.consumeOutput()
  const sizeMib = (result.sizeBytes / 1024 / 1024).toFixed(0)
  console.log(`buildroot: rootfs ready: ${rootfsPath} (${sizeMib} MiB, format=${result.format})`)
  if (result.kernelPath) console.log(`buildroot: kernel: ${result.kernelPath}`)
  if (result.dtbPath)    console.log(`buildroot: DTB: ${result.dtbPath}`)

  return { path: rootfsPath, isDirectory, format: result.format }
}
