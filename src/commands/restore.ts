/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'

import fs = require('fs')
import path = require('path')
import Utils from '../classes/utils'
import { exec } from '../lib/utils'


export default class Restore extends Command {
  config_file = '/etc/penguins-eggs.d/eggs.yaml' as string

  luksName = 'luks-eggs-backup'
  luksFile = `/run/live/medium/live/${this.luksName}`
  luksDevice = `/dev/mapper/${this.luksName}`
  luksMountpoint = '/tmp/eggs-backup'

  static description = 'Restore users, server and datas from luks-eggs-backup'

  static flags = {
    krill: Flags.boolean({ char: 'k', description: 'krill' }),
    file: Flags.string({ char: 'f', description: "file with LUKS volume encrypted" }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  static examples = ['$ sudo eggs restore']

  async run(): Promise<void> {

    const { flags } = await this.parse(Restore)
    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    let fileVolume = ''
    if (flags.file) {
      fileVolume = flags.file
    }

    const echo = Utils.setEcho(verbose)
    if (Utils.isRoot(this.id)) {
      if (flags.file && flags.krill) {
        Utils.warning(`You must use eggs restore or with`)
      }

      if (!Utils.isLive()) {
        /**
         * restore con file
         */
        if (fileVolume !== '') {
          if (fs.existsSync(fileVolume)) {
            this.luksName = path.basename(fileVolume)
            this.luksFile = fileVolume
            this.luksDevice = `/dev/mapper/${this.luksName}`
            this.luksMountpoint = '/tmp/eggs-backup'
            await this.restorePrivateData(verbose)
          } else {
            Utils.warning(`Can't find ${this.luksFile}`)
          }
        } else {
          /**
           * restore con krill su LIVE
           */
          if (flags.krill) {
            this.luksName = 'luks-eggs-backup'
            this.luksFile = `/run/live/medium/live/${this.luksName}`
            this.luksDevice = `/dev/mapper/${this.luksName}`
            this.luksMountpoint = '/tmp/eggs-backup'
            if (fs.existsSync(this.luksFile)) {
              await this.restorePrivateData(verbose)
              if (await Utils.customConfirm(`Your installed system was updated! Press a key to reboot`)) {
                await exec('reboot')
              }
              Utils.warning(`Can't find ${this.luksFile}, sure You used eggs backup to produce this LIVE?`)
            }
          } else {
            Utils.warning(`You can use eggs restore --krill only from LIVE system`)
          }
        }
      } else {
        /**
         * SIAMO SU IN SISTEMA INSTALLATO
         */
        if (fs.existsSync(fileVolume)) {
          this.luksName = path.basename(fileVolume)
          this.luksFile = fileVolume
          this.luksDevice = `/dev/mapper/${this.luksName}`
          this.luksMountpoint = '/tmp/eggs-backup'
          await this.restorePrivateData(verbose)
          if (await Utils.customConfirm(`Your system was updated! Press a key to reboot`)) {
            await exec('reboot')
          }
        } else {
          Utils.warning(`Can't find ${this.luksFile}`)
        }
      }
    }
  }

  /**
   * 
   * @param verbose 
   */
  private async restorePrivateData(verbose = false) {

    if (!fs.existsSync(this.luksMountpoint)) {
      await exec(`mkdir ${this.luksMountpoint}`)
    }

    const echo = Utils.setEcho(verbose)
    const echoYes = Utils.setEcho(verbose)

    Utils.warning(`Opening volume ${this.luksName}, you MUST user the same passphrase you choose during the backup`)
    let crytoSetup = await exec(`cryptsetup luksOpen --type luks2 ${this.luksFile} ${this.luksName}`, echoYes)

    Utils.warning(`mount ${this.luksDevice} ${this.luksMountpoint}`)
    await exec(`mount ${this.luksDevice} ${this.luksMountpoint}`, echoYes)

    /**
     * ONLY IN INSTALLING SYSTEMS
     * rm home, subst /etc/passwd, /etc/shadow, /etc/groups
     */
    if (Utils.isLive()) {
      Utils.warning('Removing live user on the destination system')
      await exec(`rm -rf /tmp/calamares-krill-root/home/*`, echo)

      Utils.warning('Restoring accounts on the installing system')
      await exec(`cp ${this.luksMountpoint}/etc/passwd /tmp/calamares-krill-root/etc/`, echo)
      await exec(`cp ${this.luksMountpoint}/etc/shadow /tmp/calamares-krill-root/etc/`, echo)
      await exec(`cp ${this.luksMountpoint}/etc/group /tmp/calamares-krill-root/etc/`, echo)
      Utils.warning('Restoring backup data on the installing system')
      await exec(`rsync -a ${this.luksMountpoint}/ROOT/ /tmp/calamares-krill-root/`, echo)
    } else {
      Utils.warning('Restoring backup data on the installing system')
      await exec(`rsync -a ${this.luksMountpoint}/ROOT/ /`, echo)
    }


    Utils.warning(`unmount volume ${this.luksName}`)
    await exec(`umount ${this.luksMountpoint}`, echo)

    Utils.warning(`Closing volume ${this.luksName}`)
    await exec(`cryptsetup luksClose ${this.luksName}`, echo)
  }
}

