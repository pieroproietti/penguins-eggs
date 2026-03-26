/**
 * plugins/build-infra/partitionfs/produce-hook.ts
 *
 * Rootless partition access hook for the eggs produce pipeline.
 * Wraps partitionfs to expose disk image partitions without root.
 */

import { Partitionfs, PartitionMount, PartitionfsOptions } from './partitionfs.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

/**
 * Run a callback with a disk image's partitions exposed as files.
 * Automatically unmounts on completion or error.
 *
 * @param imagePath   Disk image to mount
 * @param mountpoint  Directory to expose partitions in
 * @param exec        eggs exec function
 * @param verbose     Verbose output
 * @param callback    Receives the PartitionMount with partition paths
 */
export async function withPartitions(
  imagePath: string,
  mountpoint: string,
  exec: ExecFn,
  verbose: boolean,
  callback: (mount: PartitionMount) => Promise<void>,
  opts: PartitionfsOptions = {}
): Promise<void> {
  const pfs = new Partitionfs(exec, verbose, opts)
  const mount = await pfs.mount(imagePath, mountpoint)
  try {
    await callback(mount)
  } finally {
    await pfs.umount(mount)
  }
}

/**
 * Check partition access support for the current environment.
 */
export async function checkPartitionSupport(
  exec: ExecFn,
  verbose: boolean
): Promise<{ partitionfs: boolean; losetup: boolean; isRoot: boolean }> {
  const pfs = new Partitionfs(exec, verbose)
  const [partitionfs, losetup] = await Promise.all([
    pfs.isAvailable(),
    pfs.isLosetupAvailable(),
  ])
  const isRoot = process.getuid?.() === 0

  if (verbose) {
    console.log('Partition access support:')
    console.log(`  partitionfs (FUSE): ${partitionfs ? 'yes' : 'no'}`)
    console.log(`  losetup (root):     ${losetup && isRoot ? 'yes' : 'no'}`)
    console.log(`  running as root:    ${isRoot ? 'yes' : 'no'}`)
  }

  return { partitionfs, losetup, isRoot }
}
