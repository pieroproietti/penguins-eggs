/**
 * plugins/build-infra/erofs-compress/command-erofs.ts
 * oclif command: `eggs erofs`
 */

import { Args, Command, Flags } from '@oclif/core'
import { ErofsCompress, ErofsCompressor } from './erofs-compress.js'

export default class Erofs extends Command {
  static description = 'compress ISO rootfs with EROFS (kernel-native read-only filesystem)'

  static examples = [
    'sudo eggs erofs compress /live/rootfs /tmp/filesystem.erofs',
    'sudo eggs erofs compress /live/rootfs /tmp/filesystem.erofs --compressor zstd',
    'eggs erofs verify /tmp/filesystem.erofs',
    'eggs erofs dump /tmp/filesystem.erofs',
    'sudo eggs erofs extract /tmp/filesystem.erofs /tmp/rootfs-out',
  ]

  static args = {
    action: Args.string({
      description: 'action: compress | verify | dump | extract',
      options: ['compress', 'verify', 'dump', 'extract'],
      required: true,
    }),
    input: Args.string({
      description: 'input directory (compress) or .erofs image (verify/dump/extract)',
      required: true,
    }),
    output: Args.string({
      description: 'output .erofs file (compress) or extraction directory (extract)',
      required: false,
    }),
  }

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', default: false }),
    compressor: Flags.string({
      char: 'c',
      description: 'compression algorithm: lz4 | lz4hc | lzma | deflate | zstd',
      default: 'lz4hc',
    }),
    level: Flags.integer({
      char: 'l',
      description: 'compression level',
      default: 9,
    }),
    'no-tail-packing': Flags.boolean({
      description: 'disable tail-packing (inline small file tails with metadata)',
      default: false,
    }),
    label: Flags.string({
      description: 'filesystem volume label',
      default: 'eggs-rootfs',
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Erofs)

    const exec = async (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => {
      const { execSync } = await import('node:child_process')
      try {
        const data = execSync(cmd, { encoding: 'utf8', stdio: opts?.capture ? 'pipe' : 'inherit' })
        return { code: 0, data: data ?? '' }
      } catch (e: any) {
        return { code: e.status ?? 1, data: '', error: e.message }
      }
    }

    const erofs = new ErofsCompress(exec, flags.verbose, {
      compressor: flags.compressor as ErofsCompressor,
      level: flags.level,
      tailPacking: !flags['no-tail-packing'],
      label: flags.label,
    })

    switch (args.action) {
      case 'compress': {
        if (!args.output) this.error('Output path required for compress')
        const result = await erofs.compress(args.input, args.output)
        this.log(`Compressed: ${args.output}`)
        this.log(`  Input:  ${(result.inputSizeBytes / 1024 / 1024).toFixed(0)} MiB`)
        this.log(`  Output: ${(result.outputSizeBytes / 1024 / 1024).toFixed(0)} MiB`)
        this.log(`  Ratio:  ${result.compressionRatio.toFixed(2)}x`)
        this.log(`  Time:   ${(result.durationMs / 1000).toFixed(1)}s`)
        this.log(`  SHA-256: ${result.checksumSha256}`)
        break
      }

      case 'verify': {
        const ok = await erofs.verify(args.input)
        if (ok) {
          this.log(`✓ fsck.erofs passed: ${args.input}`)
        } else {
          this.error(`✗ fsck.erofs FAILED: ${args.input}`)
        }
        break
      }

      case 'dump': {
        const info = await erofs.dump(args.input)
        this.log(info)
        break
      }

      case 'extract': {
        if (!args.output) this.error('Output directory required for extract')
        await erofs.extract(args.input, args.output)
        this.log(`Extracted to: ${args.output}`)
        break
      }
    }
  }
}
