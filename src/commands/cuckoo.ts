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
    real: Flags.boolean({ char: 'r' , description: 'start a real dhcp server' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  static examples = ['$ sudo eggs cuckoo\nstart a PXE boot server']

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Cuckoo)
    let verbose = flags.verbose
    const echo = Utils.setEcho(verbose)

    let real = flags.real

    const distro = new Distro()
    if (distro.familyId === 'debian') {
      if (Utils.isRoot()) {
        if (!Pacman.packageIsInstalled('dnsmasq') ||
          (!Pacman.packageIsInstalled("pxelinux"))) {
          console.log('eggs cuckoo need to nstall dnsmasq and pxelinux.')
          if (await Utils.customConfirm()) {
            console.log('Installing dnsmasq and pxelinux... wait a moment')
            await exec('sudo apt-get update -y', Utils.setEcho(false))
            await exec('sudo apt-get install dnsmasq pxelinux -y', Utils.setEcho(false))
          } else {
            console.log('You need to install dnsmasq to start cuckoo PXE server')
            process.exit()
          }
        }
        const pxe = new Pxe()
        await pxe.fertilization()
        await pxe.structure()
        await pxe.dnsMasq(real)
        await pxe.httpStart()

        console.log(`Serving PXE boot, read more at: http://${Utils.address()}`)
        console.log(`CTRL-c to quit`)
      }
    } else {
      console.log(`Sorry: actually cuckoo is enabled just for debian family!`)
    }
  }
}
