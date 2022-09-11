/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'
import os from 'node:os'
import fs from 'fs'
import Utils from '../classes/utils'
import Pxe from '../classes/pxe'

import { IWorkDir } from '../interfaces/i-workdir'

import { exec } from '../lib/utils'
import Pacman from '../classes/pacman'

/**
 * 
 */
export default class Cuckoo extends Command {
  config_file = '/etc/penguins-eggs.d/eggs.yaml' as string
  snapshot_dir = '' as string
  work_dir = {} as IWorkDir


  static description = 'cuckoo start a boot server on the LAN sharing iso on the nest'

  static flags = {
    full: Flags.boolean({ char: 'f' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  static examples = ['$ eggs cuckoo\ncuckoo start a boot server sharing eggs on the nest']

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Cuckoo)
    let verbose = flags.verbose
    const echo = Utils.setEcho(verbose)

    let full = flags.full

    if (Utils.isRoot()) {
      if (!Pacman.packageIsInstalled('dnsmasq')) {
        console.log('installing dnsmasq...')
        await exec('sudo apt install dnsmasq')
      }
      if (!Pacman.packageIsInstalled("pxelinux")) {
        console.log('installing pxelinux')
        await exec('sudo apt install pxelinux')
      }
      const pxe = new Pxe()
      await pxe.fertilization()
      await pxe.structure()
      await pxe.dnsMasq(full)
      await pxe.httpStart()
      console.log('Serving PXE')
    }
  }
}

