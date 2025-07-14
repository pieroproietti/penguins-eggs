/**
 * ./src/commands/syncfrom.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'

import Distro from '../classes/distro.js'
import Utils from '../classes/utils.js'
import { IRemix } from '../interfaces/index.js'
import { exec } from '../lib/utils.js'

/**
 *
 */
export default class Syncfrom extends Command {
  static description = 'restore users and user data from a LUKS volumes'

  static examples = ['sudo eggs syncfrom', 'sudo eggs syncfrom --file /path/to/luks-volume']

  static flags = {
    delete: Flags.string({ description: 'rsync --delete delete extraneous files from dest dirs' }),
    file: Flags.string({ char: 'f', description: 'file containing luks-volume encrypted' }),
    help: Flags.help({ char: 'h' }),
    rootdir: Flags.string({ char: 'r', description: 'rootdir of the installed system, when used from live' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  echo = {}

  luksName = 'luks-volume'

  luksDevice = `/dev/mapper/${this.luksName}`

  luksFile = ''

  luksMountpoint = `/tmp/mnt/${this.luksName}`

  remix = {} as IRemix

  rootDir = '/'

  verbose = false

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

  /**
   *
   */
  async luksOpen() {
    if (fs.existsSync(this.luksDevice)) {
      Utils.warning(`LUKS volume: ${this.luksName} already open`)
    } else {
      Utils.warning(`LUKS open volume: ${this.luksName}`)
      await exec(`cryptsetup luksOpen --type luks2 ${this.luksFile} ${this.luksName}`, Utils.setEcho(true))
    }

    if (!fs.existsSync(this.luksMountpoint)) {
      await exec(`mkdir -p ${this.luksMountpoint}`, this.echo)
    }

    if (Utils.isMountpoint(this.luksMountpoint)) {
      Utils.warning(`mount volume: ${this.luksDevice} already mounted on ${this.luksMountpoint}`)
    } else {
      Utils.warning(`mount volume: ${this.luksDevice} on ${this.luksMountpoint}`)
      await exec(`mount ${this.luksDevice} ${this.luksMountpoint}`, this.echo)
    }
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Syncfrom)

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
        const distro = new Distro()
        fileVolume = `${distro.liveMediumPath}live/${this.luksName}`
      }

      if (Utils.isLive()) {
        /**
         * WORKING FROM LIVE
         */
        this.luksName = path.basename(fileVolume)
        this.luksFile = fileVolume
        this.luksDevice = `/dev/mapper/${this.luksName}`
        this.luksMountpoint = `/tmp/${this.luksName}`
        await this.restorePrivateData()
      } else {
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

      // Rimozione dei file esistenti
      await exec(`rm -rf ${this.rootDir}/etc/lightdm/lightdm.conf`, this.echo)
      await exec(`rm -rf ${this.rootDir}/etc/passwd`, this.echo)
      await exec(`rm -rf ${this.rootDir}/etc/group`, this.echo)
      await exec(`rm -rf ${this.rootDir}/etc/shadow`, this.echo)
      await exec(`rm -rf ${this.rootDir}/home/*`, this.echo)

      // unsquashfs
      const cmd = `unsquashfs -d ${this.rootDir} -f ${this.luksMountpoint}/private.squashfs`
      await exec(cmd, Utils.setEcho(true))
    }

    await this.luksClose()
  }
}
