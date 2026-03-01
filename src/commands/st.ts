/**
 * ./src/commands/st.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 *
 * Integration: produce System Transparency compatible boot artifacts.
 */

import { Args, Command, Flags } from '@oclif/core'

import Utils from '../classes/utils.js'
import { exec } from '../lib/utils.js'

export default class St extends Command {
  static description = 'produce System Transparency compatible boot artifacts from eggs ISOs'

  static examples = [
    'sudo eggs st package /home/eggs/egg-debian.iso --label my-distro --key /path/to/key.pem',
    'eggs st keygen --output /etc/penguins-eggs.d/st-keys/',
    'eggs st verify /tmp/st-output/descriptor.json --pubkey /path/to/key.pub',
    'sudo eggs st extract /home/eggs/egg-debian.iso --output /tmp/components',
  ]

  static args = {
    action: Args.string({
      description: 'action: package, keygen, verify, extract',
      options: ['package', 'keygen', 'verify', 'extract'],
      required: true,
    }),
    path: Args.string({
      description: 'ISO path (package/extract) or descriptor path (verify)',
      required: false,
    }),
  }

  static flags = {
    help: Flags.help({ char: 'h' }),
    label: Flags.string({ description: 'OS package label' }),
    key: Flags.string({ description: 'Ed25519 private key for signing' }),
    pubkey: Flags.string({ description: 'Ed25519 public key for verification' }),
    output: Flags.string({ char: 'o', description: 'output directory' }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(St)
    Utils.titles(this.id + ' ' + this.argv)

    const { StOutput } = await import('penguins-eggs-integrations/build-infra')
    const st = new StOutput(exec, flags.verbose)

    switch (args.action) {
      case 'package': {
        if (!args.path) this.error('ISO path required')
        if (!Utils.isRoot()) this.error('package requires root (to mount ISO)')

        const label = flags.label || `eggs-${Date.now()}`
        const outputDir = flags.output || `/tmp/st-${label}`

        this.log(`Creating ST package from ${args.path}...`)
        const result = await st.createPackage(args.path, outputDir, label, flags.key)

        this.log('ST package created:')
        this.log(`  Bundle: ${result.bundlePath}`)
        this.log(`  Descriptor: ${result.descriptorPath}`)
        if (result.signaturePath) {
          this.log(`  Signature: ${result.signaturePath}`)
        }

        break
      }

      case 'keygen': {
        const outputDir = flags.output || '/etc/penguins-eggs.d/st-keys'
        this.log('Generating Ed25519 key pair...')
        const keys = await st.generateKey(outputDir)
        this.log(`Private key: ${keys.privateKey}`)
        this.log(`Public key: ${keys.publicKey}`)
        break
      }

      case 'verify': {
        if (!args.path) this.error('descriptor path required')
        if (!flags.pubkey) this.error('--pubkey required for verification')

        const sigPath = `${args.path}.sig`
        const result = await exec(
          `openssl pkeyutl -verify -pubin -inkey "${flags.pubkey}" -in "${args.path}" -sigfile "${sigPath}"`,
          { capture: true }
        )

        if (result.code === 0) {
          this.log('Signature verification: PASSED')
        } else {
          this.error('Signature verification: FAILED')
        }

        break
      }

      case 'extract': {
        if (!args.path) this.error('ISO path required')
        if (!Utils.isRoot()) this.error('extract requires root')

        const outputDir = flags.output || '/tmp/st-extract'
        const components = await st.extractFromIso(args.path, outputDir)
        this.log('Extracted:')
        this.log(`  Kernel: ${components.kernel}`)
        this.log(`  Initramfs: ${components.initramfs}`)
        this.log(`  Root FS: ${components.rootfs}`)
        break
      }
    }
  }
}
