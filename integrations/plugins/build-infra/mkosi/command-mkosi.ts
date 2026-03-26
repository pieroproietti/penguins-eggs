/**
 * plugins/build-infra/mkosi/command-mkosi.ts
 * oclif command: `eggs mkosi`
 */

import { Args, Command, Flags } from '@oclif/core'
import { Mkosi, MkosiDistribution, MkosiFormat } from './mkosi.js'

export default class MkosiCmd extends Command {
  static description = 'build a base OS image with mkosi for use as eggs rootfs source'

  static examples = [
    'eggs mkosi build --distribution debian --release bookworm --output /tmp/mkosi-rootfs',
    'eggs mkosi build --distribution fedora --release 40 --verity --secure-boot',
    'eggs mkosi uki /tmp/filesystem.squashfs --output recovery.efi --verity --secure-boot',
    'eggs mkosi version',
  ]

  static args = {
    action: Args.string({
      description: 'action: build | uki | version',
      options: ['build', 'uki', 'version'],
      required: true,
    }),
    input: Args.string({
      description: 'input SquashFS path (uki action only)',
      required: false,
    }),
  }

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', default: false }),
    distribution: Flags.string({ char: 'd', description: 'target distribution' }),
    release: Flags.string({ char: 'r', description: 'distribution release/version' }),
    format: Flags.string({ char: 'f', description: 'output format: disk|uki|directory|squashfs|erofs', default: 'directory' }),
    output: Flags.string({ char: 'o', description: 'output path' }),
    packages: Flags.string({ char: 'p', description: 'comma-separated packages to install' }),
    verity: Flags.boolean({ description: 'enable dm-verity', default: false }),
    'secure-boot': Flags.boolean({ description: 'enable Secure Boot signing', default: false }),
    'secure-boot-key': Flags.string({ description: 'Secure Boot signing key path' }),
    'secure-boot-cert': Flags.string({ description: 'Secure Boot certificate path' }),
    cmdline: Flags.string({ description: 'kernel command line' }),
    'work-dir': Flags.string({ description: 'working directory', default: '/tmp/eggs-mkosi' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MkosiCmd)

    const exec = async (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => {
      const { execSync } = await import('node:child_process')
      try {
        const data = execSync(cmd, { encoding: 'utf8', stdio: opts?.capture ? 'pipe' : 'inherit' })
        return { code: 0, data: data ?? '' }
      } catch (e: any) {
        return { code: e.status ?? 1, data: '', error: e.message }
      }
    }

    const mkosi = new Mkosi(exec, flags.verbose, {
      distribution: flags.distribution as MkosiDistribution,
      release: flags.release,
      format: flags.format as MkosiFormat,
      outputDir: flags.output,
      packages: flags.packages?.split(',').map(p => p.trim()),
      verity: flags.verity,
      secureBoot: flags['secure-boot'],
      secureBootKey: flags['secure-boot-key'],
      secureBootCert: flags['secure-boot-cert'],
      kernelCommandLine: flags.cmdline,
    })

    switch (args.action) {
      case 'version': {
        if (!(await mkosi.isAvailable())) {
          this.error('mkosi not found. Install: pipx install git+https://github.com/systemd/mkosi.git')
        }
        this.log(await mkosi.version())
        break
      }

      case 'build': {
        const result = await mkosi.build(flags['work-dir'])
        this.log(`Output:  ${result.outputPath}`)
        this.log(`Format:  ${result.format}`)
        this.log(`Size:    ${(result.sizeBytes / 1024 / 1024).toFixed(1)} MiB`)
        if (result.rootHash) this.log(`Root hash: ${result.rootHash}`)
        break
      }

      case 'uki': {
        if (!args.input) this.error('input SquashFS path required for uki action')
        const output = flags.output ?? '/tmp/eggs-mkosi/recovery.efi'
        const result = await mkosi.buildUki(args.input, flags['work-dir'], output)
        this.log(`UKI:     ${result.outputPath}`)
        this.log(`Size:    ${(result.sizeBytes / 1024 / 1024).toFixed(1)} MiB`)
        if (result.rootHash) this.log(`Root hash: ${result.rootHash}`)
        break
      }
    }
  }
}
