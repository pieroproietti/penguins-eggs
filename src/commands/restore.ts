/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'

import fs = require('fs')
import Utils from '../classes/utils'
import { exec } from '../lib/utils'


export default class Restore extends Command {
  config_file = '/etc/penguins-eggs.d/eggs.yaml' as string

  luksName = 'luks-eggs-backup'
  luksFile = `/run/live/medium/live/${this.luksName}`
  luksDevice = `/dev/mapper/${this.luksName}`
  luksMountpoint = '/mnt'

  static description = 'Restore users, server and datas from luks-eggs-backup'

  static flags = {
    calamares: Flags.boolean({ char: 'c', description: 'calamares' }),
    krill: Flags.boolean({ char: 'k', description: 'krill' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  static examples = ['$ sudo eggs restore']

  async run(): Promise<void> {
    //Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Restore)
    let verbose = false
    if (flags.verbose) {
      verbose = true
    }
    const echo = Utils.setEcho(verbose)
    if (Utils.isRoot(this.id)) {
      if (Utils.isLive()) {
        if (!flags.calamares || !flags.krill) {
          if (fs.existsSync(this.luksFile)) {
            await this.restorePrivateData(verbose)
          } else {
            Utils.warning(`Can't find ${this.luksFile}`)
          }
        } else {
          Utils.warning(`eggs restore it's an internal command used from installers only`)
        }
      } else {
        Utils.warning('You cannot use: eggs restore on installed systems')
      }
    }
  }

  /**
   * 
   * @param verbose 
   */
  private async restorePrivateData(verbose = false) {
    const echo = Utils.setEcho(verbose)
    const echoYes = Utils.setEcho(verbose)

    Utils.warning(`Opening volume ${this.luksName}, you MUST user the same passphrase you choose during the backup`)
    let crytoSetup = await exec(`cryptsetup luksOpen --type luks2 ${this.luksFile} ${this.luksName}`, echoYes)


    Utils.warning(`mount ${this.luksDevice} ${this.luksMountpoint}`)
    await exec(`mount ${this.luksDevice} ${this.luksMountpoint}`, echoYes)

    Utils.warning('Removing live user on the destination system')
    await exec(`rm -rf /tmp/calamares-krill-root/home/*`, echo)

    Utils.warning('Restoring backup data on the installing system')
    await exec(`rsync -a ${this.luksMountpoint}/ROOT/ /tmp/calamares-krill-root/`, echo)

    Utils.warning('Restoring accounts on the installing system')
    await exec(`cp ${this.luksMountpoint}/etc/passwd /tmp/calamares-krill-root/etc/`, echo)
    await exec(`cp ${this.luksMountpoint}/etc/shadow /tmp/calamares-krill-root/etc/`, echo)
    await exec(`cp ${this.luksMountpoint}/etc/group /tmp/calamares-krill-root/etc/`, echo)

    Utils.warning(`unmount volume ${this.luksName}`)
    await exec(`umount ${this.luksMountpoint}`, echo)

    Utils.warning(`Closing volume ${this.luksName}`)
    await exec(`cryptsetup luksClose ${this.luksName}`, echo)
  }
}

