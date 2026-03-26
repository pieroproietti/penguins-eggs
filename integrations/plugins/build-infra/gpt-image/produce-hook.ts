/**
 * plugins/build-infra/gpt-image/produce-hook.ts
 *
 * Post-produce hook: wrap an eggs-produced EFI binary and rootfs image into
 * a bootable GPT disk image using UEFI-GPT-image-creator.
 *
 * Usage in ovary.d/produce.ts (after verity-squash or uki-lite):
 *   import { gptImageAfterProduce } from './integrations/gpt-image-hook.js'
 *   await gptImageAfterProduce(efiBinary, squashfsPath, outputPath, exec, verbose)
 */

import { GptImage, GptImageOptions, GptImageResult } from './gpt-image.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

/**
 * Produce a bootable GPT disk image from an eggs EFI binary and rootfs.
 *
 * @param efiBinary    Signed UKI or BOOTX64.EFI (from verity-squash or uki-lite)
 * @param rootfsPath   SquashFS/EROFS/DwarFS rootfs image (placed in data partition)
 * @param outputPath   Output .hdd image path
 * @param exec         eggs exec function
 * @param verbose      Verbose output
 * @param opts         Additional GptImage options
 */
export async function gptImageAfterProduce(
  efiBinary: string,
  rootfsPath: string,
  outputPath: string,
  exec: ExecFn,
  verbose: boolean,
  opts: Partial<GptImageOptions> = {}
): Promise<GptImageResult> {
  const { statSync } = await import('node:fs')
  const rootfsSizeMib = Math.ceil(statSync(rootfsPath).size / 1024 / 1024)
  // Add 10% headroom for the data partition
  const dataSizeMib = Math.ceil(rootfsSizeMib * 1.1)

  const gpt = new GptImage(exec, verbose, {
    efiBinary,
    outputPath,
    espSizeMib: opts.espSizeMib ?? 100,
    dataSizeMib,
    dataFiles: {
      [`live/${require('node:path').basename(rootfsPath)}`]: rootfsPath,
    },
    vhd: opts.vhd ?? false,
    ...opts,
  })

  console.log(`gpt-image: creating GPT disk image: ${outputPath}`)
  const result = await gpt.create()

  const sizeMib = (result.sizeBytes / 1024 / 1024).toFixed(0)
  console.log(`gpt-image: ${outputPath} (${sizeMib} MiB)`)
  console.log(`gpt-image: ESP=${result.espSizeMib} MiB, data=${result.dataSizeMib} MiB`)
  console.log(`gpt-image: write to USB: dd if=${outputPath} of=/dev/sdX bs=4M status=progress`)

  return result
}
