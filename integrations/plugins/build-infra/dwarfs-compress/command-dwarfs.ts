/**
 * plugins/build-infra/dwarfs-compress/command-dwarfs.ts
 * oclif command: `eggs dwarfs`
 *
 * Compress a directory or existing ISO rootfs with DwarFS, or verify
 * an existing DwarFS image.
 */

import { Args, Command, Flags } from '@oclif/core'
import { DwarfsCompress, DwarfsCompressor } from './dwarfs-compress.js'

export default class Dwarfs extends Command {
  static description = 'compress ISO rootfs with DwarFS (alternative to SquashFS)'

  static examples = [
    'sudo eggs dwarfs compress /live/rootfs /tmp/filesystem.dwarfs',
    'sudo eggs dwarfs compress /live/rootfs /tmp/filesystem.dwarfs --compressor lzma --level 9',
    'eggs dwarfs verify /tmp/filesystem.dwarfs',
    'eggs dwarfs checksums /tmp/filesystem.dwarfs --output checksums.sha512',
  ]

  static args = {
    action: Args.string({
      description: 'action: compress | verify | checksums',
      options: ['compress', 'verify', 'checksums'],
      required: true,
    }),
    input: Args.string({
      description: 'input directory (compress) or .dwarfs image (verify/checksums)',
      required: true,
    }),
    output: Args.string({
      description: 'output .dwarfs file (compress) or checksum file (checksums)',
      required: false,
    }),
  }

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', default: false }),
    compressor: Flags.string({
      char: 'c',
      description: 'compression algorithm: zstd | lzma | brotli | none',
      default: 'zstd',
    }),
    level: Flags.integer({
      char: 'l',
      description: 'compression level 1-9',
      default: 7,
    }),
    workers: Flags.integer({
      char: 'j',
      description: 'number of worker threads (0 = all CPUs)',
      default: 0,
    }),
    'no-categorize': Flags.boolean({
      description: 'disable file categorization (PCM→FLAC, incompressible→none)',
      default: false,
    }),
    'block-size': Flags.integer({
      description: 'block size in MiB',
      default: 16,
    }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Dwarfs)

    // Inline exec shim — in production this comes from eggs' own exec utility
    const exec = async (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => {
      const { execSync } = await import('node:child_process')
      try {
        const data = execSync(cmd, { encoding: 'utf8', stdio: opts?.capture ? 'pipe' : 'inherit' })
        return { code: 0, data: data ?? '' }
      } catch (e: any) {
        return { code: e.status ?? 1, data: '', error: e.message }
      }
    }

    const dwarfs = new DwarfsCompress(exec, flags.verbose, {
      compressor: flags.compressor as DwarfsCompressor,
      level: flags.level,
      workers: flags.workers,
      categorize: !flags['no-categorize'],
      blockSizeMib: flags['block-size'],
    })

    switch (args.action) {
      case 'compress': {
        if (!args.output) this.error('Output path required for compress')
        const result = await dwarfs.compress(args.input, args.output)
        this.log(`Compressed: ${args.output}`)
        this.log(`  Input:  ${(result.inputSizeBytes / 1024 / 1024).toFixed(0)} MiB`)
        this.log(`  Output: ${(result.outputSizeBytes / 1024 / 1024).toFixed(0)} MiB`)
        this.log(`  Ratio:  ${result.compressionRatio.toFixed(2)}x`)
        this.log(`  Time:   ${(result.durationMs / 1000).toFixed(1)}s`)
        this.log(`  SHA-512: ${result.checksumSha512}`)
        break
      }

      case 'verify': {
        const ok = await dwarfs.verify(args.input)
        if (ok) {
          this.log(`✓ Integrity check passed: ${args.input}`)
        } else {
          this.error(`✗ Integrity check FAILED: ${args.input}`)
        }
        break
      }

      case 'checksums': {
        const outFile = args.output ?? `${args.input}.sha512sums`
        await dwarfs.generateChecksums(args.input, outFile)
        this.log(`Checksums written to: ${outFile}`)
        this.log('Verify with: sha512sum --check ' + outFile)
        break
      }
    }
  }
}
