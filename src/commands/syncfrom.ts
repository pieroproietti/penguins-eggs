/**
 * penguins-eggs
 * command: syncfrom.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, Flags} from '@oclif/core'

import fs from 'fs'
import path  from 'path'
import Utils from '../classes/utils'
import {exec} from '../lib/utils'

/**
 *
 */
export default class Syncfrom extends Command {
  static flags = {
    delete: Flags.string({description: 'rsync --delete delete extraneous files from dest dirs'}),
    file: Flags.string({char: 'f', description: 'file containing luks-volume encrypted'}),
    help: Flags.help({char: 'h'}),
    rootdir: Flags.string({char: 'r', description: 'rootdir of the installed system, when used from live'}),
    verbose: Flags.boolean({char: 'v', description: 'verbose'}),
  }

  static description = 'restore users and user data from a LUKS volumes'
  static examples = [
    'sudo eggs syncfrom',
    'sudo eggs syncfrom --file /path/to/luks-volume',
  ]

  verbose = false

  echo = {}

  rootDir = '/'

  luksName = 'luks-volume'

  luksFile = `/run/live/medium/live/${this.luksName}`

  luksDevice = `/dev/mapper/${this.luksName}`

  luksMountpoint = `/tmp/${this.luksName}`

  async run(): Promise<void> {
    const {flags} = await this.parse(Syncfrom)

    if (flags.verbose) {
      this.verbose = true
    }

    this.echo = Utils.setEcho(this.verbose)

    let fileVolume = ''
    if (flags.file) {
      fileVolume = flags.file
    }

    let destDelete = false
    if (flags.delete) {
      destDelete = true
    }

    if (Utils.isLive()) {
      if (flags.rootdir) {
        this.rootDir = flags.rootdir
      } else {
        Utils.pressKeyToExit('Argument --rootdir is mandatory, when running live! Process will terminate')
      }
    }

    if (Utils.isRoot()) {
      if (fileVolume === '') {
        fileVolume = '/run/live/medium/live/luks-volume'
      }

      if (!Utils.isLive()) {
        /**
         * WORKING FROM INSTALLED
         */
        if (fs.existsSync(fileVolume)) {
          this.luksName = path.basename(fileVolume)
          this.luksFile = fileVolume
          this.luksDevice = `/dev/mapper/${this.luksName}`
          this.luksMountpoint = `/tmp/${this.luksName}`

          await this.restorePrivateData()
          if (await Utils.customConfirm('Your system was updated! Press a key to reboot')) {
            await exec('reboot')
          }
        } else {
          Utils.pressKeyToExit(`Can't find ${this.luksFile}`)
        }
      } else {
        /**
         * WORKING FROM LIVE
         */
        this.luksName = path.basename(fileVolume)
        this.luksFile = fileVolume
        this.luksDevice = `/dev/mapper/${this.luksName}`
        this.luksMountpoint = `/tmp/${this.luksName}`
        await this.restorePrivateData()
      }
    } else {
      Utils.useRoot(this.id)
    }
  }

  /**
   *
   * @param verbose
   */
  private async restorePrivateData(destDelete = false) {
    if (!fs.existsSync(this.luksMountpoint)) {
      await exec(`mkdir ${this.luksMountpoint}`, this.echo)
    }

    await this.luksOpen()

    if (Utils.isLive() && this.rootDir !== '/') {

      Utils.warning('Restoring crypted data')
      await exec(`unsquash -f -d  ${this.rootDir} ${this.luksMountpoint}/private.squashfs`, this.echo)
    }
    await this.luksClose()
  }

  /**
   *
   */
  async luksOpen() {
    if (!fs.existsSync(this.luksDevice)) {
      Utils.warning(`LUKS open volume: ${this.luksName}`)
      await exec(`cryptsetup luksOpen --type luks2 ${this.luksFile} ${this.luksName}`, Utils.setEcho(true))
    } else {
      Utils.warning(`LUKS volume: ${this.luksName} already open`)
    }

    if (!fs.existsSync(this.luksMountpoint)) {
      await exec(`mkdir -p ${this.luksMountpoint}`, this.echo)
    }

    if (!Utils.isMountpoint(this.luksMountpoint)) {
      Utils.warning(`mount volume: ${this.luksDevice} on ${this.luksMountpoint}`)
      await exec(`mount ${this.luksDevice} ${this.luksMountpoint}`, this.echo)
    } else {
      Utils.warning(`mount volume: ${this.luksDevice} already mounted on ${this.luksMountpoint}`)
    }
  }

  /**
  *
  */
  async luksClose() {
    if (Utils.isMountpoint(this.luksMountpoint)) {
      await exec(`umount ${this.luksMountpoint}`, this.echo)
    }

    if (fs.existsSync(this.luksDevice)) {
      Utils.warning(`LUKS close volume: ${this.luksName}`)
      await exec(`cryptsetup luksClose ${this.luksName}`, this.echo)
    }
  }
}

