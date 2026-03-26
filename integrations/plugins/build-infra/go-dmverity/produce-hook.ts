/**
 * plugins/build-infra/go-dmverity/produce-hook.ts
 *
 * Post-produce hook: generate a dm-verity hash tree for any eggs-produced
 * filesystem image (SquashFS, EROFS, DwarFS).
 *
 * This is the lower-level alternative to verity-squash/produce-hook.ts.
 * Use this when you want dm-verity hash tree generation without the full
 * verity-squash-root UKI signing pipeline.
 *
 * Usage in ovary.d/produce.ts:
 *   import { dmverityAfterProduce } from './integrations/go-dmverity-hook.js'
 *
 *   const verity = await dmverityAfterProduce(fsImagePath, exec, verbose)
 *   console.log(`Root hash: ${verity.rootHash}`)
 */

import path from 'node:path'
import { GoDmverity, VerityOptions, VerityResult } from './go-dmverity.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

/**
 * Generate a dm-verity hash tree for an eggs-produced filesystem image.
 * The hash tree is written alongside the image as <image>.verity.
 *
 * @param fsImagePath  Path to the filesystem image (squashfs/erofs/dwarfs)
 * @param exec         eggs exec function
 * @param verbose      Verbose output
 * @param opts         dm-verity options
 * @returns            Verity result including root hash
 */
export async function dmverityAfterProduce(
  fsImagePath: string,
  exec: ExecFn,
  verbose: boolean,
  opts: VerityOptions = {}
): Promise<VerityResult> {
  const verity = new GoDmverity(exec, verbose, opts)
  const hashTreePath = `${fsImagePath}.verity`

  console.log(`dm-verity: generating hash tree for ${path.basename(fsImagePath)}...`)
  const result = await verity.format(fsImagePath, hashTreePath)

  console.log(`dm-verity: root hash: ${result.rootHash}`)
  console.log(`dm-verity: hash tree: ${hashTreePath}`)
  console.log(`dm-verity: data SHA-256: ${result.dataChecksum.slice(0, 16)}...`)

  return result
}

/**
 * Verify a filesystem image against its hash tree.
 * Returns true if the image is unmodified.
 */
export async function dmverityVerify(
  fsImagePath: string,
  rootHash: string,
  exec: ExecFn,
  verbose: boolean
): Promise<boolean> {
  const verity = new GoDmverity(exec, verbose)
  const hashTreePath = `${fsImagePath}.verity`

  const ok = await verity.verify(fsImagePath, hashTreePath, rootHash)
  if (ok) {
    console.log(`dm-verity: verification passed: ${path.basename(fsImagePath)}`)
  } else {
    console.error(`dm-verity: verification FAILED — image may be tampered: ${fsImagePath}`)
  }
  return ok
}
