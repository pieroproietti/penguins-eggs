/**
 * penguins-eggs-v9
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'

import fs = require('fs')
import path = require('path')
import Utils from '../classes/utils'
import { exec } from '../lib/utils'


export default class Syncfrom extends Command {
  luksName = 'luks-eggs-backup'
  luksFile = `/run/live/medium/live/${this.luksName}`
  luksDevice = `/dev/mapper/${this.luksName}`
  luksMountpoint = '/tmp/eggs-backup'
  rootDir = '/'

  static description = 'Restore users, server and datas from luks-eggs-backup'

  static flags = {
    file: Flags.string({ char: 'f', description: "file with LUKS volume encrypted" }),
    rootdir: Flags.string({ char: 'r', description: 'rootdir of the installed system, when used from live' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  static examples = ['$ sudo eggs restore']

  async run(): Promise<void> {

    const { flags } = await this.parse(Syncfrom)
    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    let fileVolume = ''
    if (flags.file) {
      fileVolume = flags.file
    }

    if (Utils.isLive()) {
      if (flags.rootdir) {
        this.rootDir = flags.rootdir
      } else {
        Utils.warning(`Argument --rootdir is mandatory, when running from live! Process will terminate`)
        process.exit()
      }
    } else {
      this.rootDir = '/'
    }

    const echo = Utils.setEcho(verbose)
    if (Utils.isRoot(this.id)) {
      if (fileVolume === '') {
        fileVolume = '/run/live/medium/live/luks-eggs-backup'
        Utils.warning(`You didn't give any file, I will use ${fileVolume}`)
      }

      if (!Utils.isLive()) {
        /**
         * WORKING FROM INSTALLED
         */

        /**
         * restore con file on INSTALLED system
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
      } else {
        /**
         * WORKING FROM LIVE
         */

        /**
         * restore con file from LIVE system
         */
        this.luksName = path.basename(fileVolume)
        this.luksFile = fileVolume
        this.luksDevice = `/dev/mapper/${this.luksName}`
        this.luksMountpoint = '/tmp/eggs-backup'
        await this.restorePrivateData(verbose)
        if (await Utils.customConfirm(`Your INSTALLED system was updated! Press a key to reboot`)) {
          await exec('reboot')
        } else {
          Utils.warning(`Check yours options...}`)
        }
      }
    }
  }


  /**
   * 
   * @param verbose 
   */
  private async restorePrivateData(verbose = false) {
    const echo = Utils.setEcho(verbose)

    if (!fs.existsSync(this.luksMountpoint)) {
      await exec(`mkdir ${this.luksMountpoint}`)
    }

    await this.luksOpen()

    /**
     * ONLY FROM LIVE
     * rm home, subst /etc/passwd, /etc/shadow, /etc/groups
     */
    if (Utils.isLive()) {
      if (this.rootDir !== '/') {
        Utils.warning('Removing live user on destination system')
        await exec(`rm -rf ${this.rootDir}/home/*`, echo)
        Utils.warning('Restoring accounts')
        await exec(`cp ${this.luksMountpoint}/etc/passwd ${this.rootDir}/etc/`, echo)
        await exec(`cp ${this.luksMountpoint}/etc/shadow ${this.rootDir}/etc/`, echo)
        await exec(`cp ${this.luksMountpoint}/etc/group ${this.rootDir}/etc/`, echo)
      }
    }
    Utils.warning('Restoring backup data')
    await exec(`rsync -a ${this.luksMountpoint}/ROOT/ ${this.rootDir}/`, echo)

    await this.luksClose()
  }

  /**
   * 
   */
  async luksOpen(verbose = false) {
    const echo = Utils.setEcho(verbose)
    const echoYes = Utils.setEcho(true) // echoYes serve solo per cryptsetup luksOpen

    Utils.warning(`LUKS open volume: ${this.luksName}`)
    await exec(`cryptsetup luksOpen --type luks2 ${this.luksFile} ${this.luksName}`, echoYes)

    Utils.warning(`mount volume: ${this.luksDevice} on ${this.luksMountpoint}`)
    if (!fs.existsSync(this.luksMountpoint)) {
      await exec(`mkdir -p ${this.luksMountpoint}`, echo)
    }
    await exec(`mount ${this.luksDevice} ${this.luksMountpoint}`, echo)
  }

  /**
  * 
  */
  async luksClose(verbose = false) {
    const echo = Utils.setEcho(verbose)

    if (Utils.isMountpoint(this.luksMountpoint)) {
      await exec(`umount ${this.luksMountpoint}`, echo)
    }

    Utils.warning(`LUKS close volume: ${this.luksName}`)
    await exec(`cryptsetup luksClose ${this.luksName}`, echo)
  }

}

