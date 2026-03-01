/**
 * plugins/decentralized/brig-publish/command-ipfs.ts
 * oclif command: `eggs ipfs`
 *
 * Manages IPFS-based distribution of eggs ISOs.
 */

import { Args, Command, Flags } from '@oclif/core'

import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'
import { BrigPublisher } from '../../lib/integrations/brig-publisher.js'
import { loadIpfsConfig, saveIpfsConfig } from '../../lib/integrations/ipfs-config.js'

export default class Ipfs extends Command {
  static description = 'manage IPFS distribution of eggs ISOs'

  static examples = [
    'sudo eggs ipfs publish /home/eggs/egg-debian-amd64.iso',
    'eggs ipfs list',
    'eggs ipfs get /isos/egg-debian-amd64.iso --dest /tmp/',
    'eggs ipfs gateway',
    'sudo eggs ipfs enable',
  ]

  static args = {
    action: Args.string({
      description: 'action to perform',
      options: ['publish', 'list', 'get', 'gateway', 'history', 'enable', 'disable', 'setup'],
      required: true,
    }),
    path: Args.string({
      description: 'ISO path (publish), brig path (get/history), or config value',
      required: false,
    }),
  }

  static flags = {
    help: Flags.help({ char: 'h' }),
    dest: Flags.string({ char: 'd', description: 'destination path for get' }),
    backend: Flags.string({ description: 'IPFS backend: brig, raw-ipfs, ipgit' }),
    remote: Flags.string({ description: 'brig remote name' }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Ipfs)
    Utils.titles(this.id + ' ' + this.argv)

    const publisher = new BrigPublisher(exec, flags.verbose)

    switch (args.action) {
      case 'publish': {
        if (!args.path) this.error('ISO path required')
        if (!Utils.isRoot()) this.error('publish requires root')

        if (!(await publisher.isInstalled())) {
          this.error('brig not installed. See: https://github.com/sahib/brig')
        }

        this.log(`Publishing ${args.path} to IPFS via brig...`)
        const result = await publisher.publish(args.path)
        this.log(`Published: CID=${result.cid}`)
        this.log(`Size: ${(result.size / 1024 / 1024).toFixed(1)} MB`)
        if (result.gatewayUrl) {
          this.log(`Gateway: ${result.gatewayUrl}`)
        }

        break
      }

      case 'list': {
        const files = await publisher.list()
        if (files.length === 0) {
          this.log('No ISOs published')
        } else {
          this.log('Published ISOs:')
          for (const f of files) {
            this.log(`  ${f}`)
          }
        }

        break
      }

      case 'get': {
        if (!args.path) this.error('brig path required')
        const dest = flags.dest || `/tmp/${args.path.split('/').pop()}`
        this.log(`Downloading ${args.path} to ${dest}...`)
        await publisher.get(args.path, dest)
        this.log(`Downloaded: ${dest}`)
        break
      }

      case 'gateway': {
        const url = await publisher.startGateway()
        this.log(`Gateway started: ${url}`)
        break
      }

      case 'history': {
        if (!args.path) this.error('brig path required')
        const history = await publisher.history(args.path)
        for (const entry of history) {
          this.log(entry)
        }

        break
      }

      case 'enable': {
        if (!Utils.isRoot()) this.error('enable requires root')
        const config = loadIpfsConfig()
        config.enabled = true
        if (flags.backend) config.backend = flags.backend as any
        saveIpfsConfig(config)
        this.log('IPFS distribution enabled')
        break
      }

      case 'disable': {
        if (!Utils.isRoot()) this.error('disable requires root')
        const config = loadIpfsConfig()
        config.enabled = false
        saveIpfsConfig(config)
        this.log('IPFS distribution disabled')
        break
      }

      case 'setup': {
        if (!Utils.isRoot()) this.error('setup requires root')
        const config = loadIpfsConfig()
        if (flags.backend) config.backend = flags.backend as any
        if (flags.remote) config.brig_remote = flags.remote
        saveIpfsConfig(config)
        this.log(`IPFS config saved: backend=${config.backend}`)
        break
      }
    }
  }
}
