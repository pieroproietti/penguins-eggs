/**
 * plugins/build-infra/verity-squash/command-verity.ts
 * oclif command: `eggs verity`
 */

import { Args, Command, Flags } from '@oclif/core'
import { VeritySquash } from './verity-squash.js'
import { verityInit } from './produce-hook.js'

export default class Verity extends Command {
  static description = 'dm-verity + Secure Boot signing for eggs-produced ISOs'

  static examples = [
    'sudo eggs verity init',
    'sudo eggs verity build',
    'eggs verity list',
    'sudo eggs verity sign /tmp/filesystem.squashfs /boot/efi /etc/verity_squash_root/db.key',
  ]

  static args = {
    action: Args.string({
      description: 'action: init | build | list | sign | check-deps',
      options: ['init', 'build', 'list', 'sign', 'check-deps'],
      required: true,
    }),
    squashfs: Args.string({ description: 'SquashFS image path (sign only)', required: false }),
    efiDir: Args.string({ description: 'EFI partition directory (sign only)', required: false }),
    keyPath: Args.string({ description: 'Secure Boot key path (sign only)', required: false }),
  }

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', default: false }),
    'ignore-warnings': Flags.boolean({ default: false }),
    'efi-partition': Flags.string({ default: '/boot/efi' }),
    'root-mount': Flags.string({ default: '/mnt/root' }),
    cmdline: Flags.string({ description: 'kernel cmdline' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Verity)

    const exec = async (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => {
      const { execSync } = await import('node:child_process')
      try {
        const data = execSync(cmd, { encoding: 'utf8', stdio: opts?.capture ? 'pipe' : 'inherit' })
        return { code: 0, data: data ?? '' }
      } catch (e: any) {
        return { code: e.status ?? 1, data: '', error: e.message }
      }
    }

    const verity = new VeritySquash(exec, flags.verbose, {
      efiPartition: flags['efi-partition'],
      rootMount: flags['root-mount'],
      cmdline: flags.cmdline,
      ignoreWarnings: flags['ignore-warnings'],
    })

    switch (args.action) {
      case 'init': {
        await verityInit(exec, flags.verbose, {
          efiPartition: flags['efi-partition'],
          rootMount: flags['root-mount'],
          ignoreWarnings: flags['ignore-warnings'],
        })
        break
      }

      case 'build': {
        const result = await verity.build()
        this.log(`Build complete:`)
        this.log(`  SquashFS A: ${result.squashfsA}`)
        this.log(`  Verity A:   ${result.verityA}`)
        this.log(`  EFI A:      ${result.efiA}`)
        this.log(`  Root hash:  ${result.rootHash}`)
        this.log(`  SHA-256:    ${result.squashfsChecksum}`)
        break
      }

      case 'list': {
        const listing = await verity.list()
        this.log(listing)
        break
      }

      case 'sign': {
        if (!args.squashfs || !args.efiDir || !args.keyPath) {
          this.error('sign requires: squashfs efiDir keyPath')
        }
        const result = await verity.produceVerifiedIso(args.squashfs, args.efiDir, args.keyPath)
        this.log(`Root hash: ${result.rootHash}`)
        this.log(`Verity:    ${result.verityPath}`)
        this.log(`EFI:       ${result.efiPath}`)
        break
      }

      case 'check-deps': {
        const missing = await verity.checkDependencies()
        if (missing.length === 0) {
          this.log('✓ All dependencies present')
        } else {
          this.warn(`Missing: ${missing.join(', ')}`)
          this.log('Install: apt install squashfs-tools cryptsetup-bin binutils sbsigntool openssl')
        }
        break
      }
    }
  }
}
