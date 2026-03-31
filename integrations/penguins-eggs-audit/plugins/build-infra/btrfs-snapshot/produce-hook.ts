/**
 * plugins/build-infra/btrfs-snapshot/produce-hook.ts
 * Pre/post hooks for eggs produce that create BTRFS snapshots.
 *
 * Usage in ovary.d/produce.ts:
 *   import { beforeProduce, afterProduce } from '../../lib/integrations/btrfs-produce-hook.js'
 *
 *   // At start of produce():
 *   await beforeProduce(exec, verbose)
 *
 *   // At end of produce():
 *   await afterProduce(isoFilename, isoSize, exec, verbose)
 */

import { BtrfsSnapshot } from './btrfs-snapshot.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export async function beforeProduce(exec: ExecFn, verbose: boolean): Promise<void> {
  const snap = new BtrfsSnapshot(exec, verbose)

  if (!(await snap.isBtrfs())) {
    if (verbose) console.log('Not BTRFS, skipping pre-produce snapshot')
    return
  }

  try {
    const result = await snap.preProduceSnapshot()
    console.log(`BTRFS: pre-produce snapshot: ${result.name}`)
  } catch (err: any) {
    console.warn(`BTRFS snapshot failed (non-fatal): ${err.message}`)
  }
}

export async function afterProduce(
  isoFilename: string,
  isoSize: number,
  exec: ExecFn,
  verbose: boolean
): Promise<void> {
  const snap = new BtrfsSnapshot(exec, verbose)

  if (!(await snap.isBtrfs())) return

  try {
    const result = await snap.postProduceSnapshot(isoFilename, isoSize)
    console.log(`BTRFS: post-produce snapshot: ${result.name}`)
  } catch (err: any) {
    console.warn(`BTRFS snapshot failed (non-fatal): ${err.message}`)
  }
}
