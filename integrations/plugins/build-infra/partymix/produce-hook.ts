/**
 * plugins/build-infra/partymix/produce-hook.ts
 *
 * Post-produce hook: assemble an eggs-produced rootfs and bootloader into
 * an MBR disk image using partymix.
 */

import { Partymix, PartymixOptions, PartymixResult } from './partymix.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

/**
 * Produce an MBR disk image from a FAT32 boot image and a Linux rootfs image.
 *
 * @param bootImage    FAT32 image containing bootloader (GRUB, syslinux)
 * @param rootfsImage  Linux filesystem image (ext4, squashfs, etc.)
 * @param outputPath   Output .img path
 */
export async function partymixAfterProduce(
  bootImage: string,
  rootfsImage: string,
  outputPath: string,
  exec: ExecFn,
  verbose: boolean,
  opts: Partial<PartymixOptions> = {}
): Promise<PartymixResult> {
  const partymix = new Partymix(exec, verbose, {
    outputPath,
    partitions: [
      { image: bootImage,   type: 'fat32', active: true },
      { image: rootfsImage, type: 'linux' },
    ],
    ...opts,
  })

  console.log(`partymix: assembling MBR disk image: ${outputPath}`)
  const result = await partymix.create()

  const sizeMib = (result.sizeBytes / 1024 / 1024).toFixed(0)
  console.log(`partymix: ${outputPath} (${sizeMib} MiB, ${result.partitionCount} partitions)`)
  console.log(`partymix: write to disk: dd if=${outputPath} of=/dev/sdX bs=4M status=progress`)

  return result
}
