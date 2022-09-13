/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'
import Pxe from '../classes/pxe'

import { IWorkDir } from '../interfaces/i-workdir'
import { exec } from '../lib/utils'
import Distro from '../classes/distro'

/**
 * 
 */
export default class Cuckoo extends Command {
  config_file = '/etc/penguins-eggs.d/eggs.yaml' as string
  snapshot_dir = '' as string
  work_dir = {} as IWorkDir


  static description = 'cuckoo start a PXE boot server serving the live image'

  static flags = {
    full: Flags.boolean({ char: 'f' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  static examples = ['$ sudo eggs cuckoo\nstart a PXE boot server']

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Cuckoo)
    let verbose = flags.verbose
    const echo = Utils.setEcho(verbose)

    let full = flags.full

    const distro = new Distro()
    if (distro.familyId === 'debian') {
      if (Utils.isRoot()) {
        if (!Pacman.packageIsInstalled('dnsmasq')) {
          console.log('installing dnsmasq...')
          await exec('sudo apt-get update -y')
          await exec('sudo apt-get install dnsmasq -y')
        }
        if (!Pacman.packageIsInstalled("pxelinux")) {
          console.log('installing pxelinux')
          await exec('sudo apt-get update -y')
          await exec('sudo apt-get install pxelinux -y')
        }
        const pxe = new Pxe()
        await pxe.fertilization()
        await pxe.structure()
        await pxe.dnsMasq(full)
        await pxe.httpStart()

        console.log(`Serving PXE boot, read more at: http://${Utils.address()}`)
        console.log(`CTRL-c to quit`)
      }
    } else {
      console.log(`Sorry: actually cuckoo is enabled just for debian family!`)
    }
  }
}
