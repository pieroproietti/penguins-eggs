/**
 * plugins/build-infra/mkosi/produce-hook.ts
 *
 * Pre-produce hook: use mkosi to build a clean base rootfs from distribution
 * packages, then pass it to eggs produce for remastering.
 *
 * Usage in ovary.d/produce.ts:
 *   import { mkosiPrepareRootfs } from './integrations/mkosi-hook.js'
 *   const rootfsDir = await mkosiPrepareRootfs(workDir, exec, verbose, config)
 *   // pass rootfsDir to mksquashfs/mkdwarfs/mkfs.erofs
 */

import { Mkosi, MkosiConfig, MkosiResult } from './mkosi.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

/**
 * Build a clean base rootfs using mkosi and return its directory path.
 * Pass the returned path to any eggs compression backend.
 */
export async function mkosiPrepareRootfs(
  workDir: string,
  exec: ExecFn,
  verbose: boolean,
  config: MkosiConfig = {}
): Promise<string> {
  const mkosi = new Mkosi(exec, verbose, { ...config, format: 'directory' })

  if (!(await mkosi.isAvailable())) {
    throw new Error('mkosi not found. Install: pipx install git+https://github.com/systemd/mkosi.git')
  }

  const ver = await mkosi.version()
  if (verbose) console.log(`mkosi: using ${ver}`)

  console.log(`mkosi: building base rootfs (${config.distribution ?? 'host'} ${config.release ?? ''})...`)
  const rootfsDir = await mkosi.prepareRootfs(workDir)
  console.log(`mkosi: rootfs ready: ${rootfsDir}`)
  return rootfsDir
}

/**
 * Post-produce hook: wrap an eggs-produced SquashFS in a mkosi UKI with
 * optional dm-verity and Secure Boot signing.
 */
export async function mkosiWrapUki(
  squashfsPath: string,
  workDir: string,
  outputPath: string,
  exec: ExecFn,
  verbose: boolean,
  config: MkosiConfig = {}
): Promise<MkosiResult> {
  const mkosi = new Mkosi(exec, verbose, { ...config, format: 'uki' })
  console.log(`mkosi: building UKI from ${squashfsPath}...`)
  const result = await mkosi.buildUki(squashfsPath, workDir, outputPath)
  console.log(`mkosi: UKI written: ${outputPath} (${(result.sizeBytes / 1024 / 1024).toFixed(1)} MiB)`)
  if (result.rootHash) console.log(`mkosi: dm-verity root hash: ${result.rootHash}`)
  return result
}
