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
    file: Flags.string({ char: 'f', description: 'file private encrypted' }),    
    help: Flags.help({char: 'h'}),
    rootdir: Flags.string({char: 'r', description: 'rootdir of the installed system, when used from live'}),
    verbose: Flags.boolean({char: 'v', description: 'verbose'}),
  }

  static description = 'restore users and user data from a LUKS volumes'
  static examples = [
    'sudo eggs syncfrom',
    'sudo eggs syncfrom --file /path/to/private-file',
  ]

  verbose = false

  echo = {}

  rootDir = '/'

  privateName = 'eggs-private'
  
  privateFile = `/run/live/medium/live/eggs-private`


  async run(): Promise<void> {
    const {flags} = await this.parse(Syncfrom)

    if (flags.verbose) {
      this.verbose = true
    }

    this.echo = Utils.setEcho(this.verbose)

    if (flags.file) {
      this.privateFile = flags.file
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
      if (!Utils.isLive()) {
        /**
         * WORKING FROM INSTALLED
         */
        if (fs.existsSync(this.privateFile)) {
          await this.restorePrivateData()
          if (await Utils.customConfirm('Your system was updated! Press a key to reboot')) {
            await exec('reboot')
          }
        } else {
          Utils.pressKeyToExit(`Can't find ${this.privateFile}`)
        }
      } else {
        /**
         * WORKING FROM LIVE
         */
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
    /**
     * ONLY FROM LIVE
     * rm home, subst /etc/passwd, /etc/shadow, /etc/groups
     */
    if (Utils.isLive() && this.rootDir !== '/') {
      Utils.warning('Removing live user on destination system')
      await exec(`rm -rf ${this.rootDir}/home/*`, this.echo)
    }

    Utils.warning('Restoring crypted data')

    // Decrypt the file
    let decrypt = `openssl enc -aes256 -d -salt -in ${this.privateFile}.tar.zsd.enc -out /tmp/${this.privateName}.tar.zsd`;
    await exec(decrypt, Utils.setEcho(true));
    let rmEnc = `rm ${this.privateFile}.tar.zsd.enc`
    await exec(rmEnc, Utils.setEcho(true));

    // Decompress the file
    let decompress = `zstd -d /tmp/${this.privateName}.tar.zsd -o /tmp/${this.privateName}.tar`;
    await exec(decompress, Utils.setEcho(true));
    let rmZsd = `rm ${this.privateFile}.tar.zsd`
    await exec(rmZsd, Utils.setEcho(true))

    // Extract the tar file
    let extract = `tar -xf /tmp/${this.privateName}.tar -C ${this.rootDir}`
    await exec(extract, Utils.setEcho(true));

    // Remove the tar file
    let rmTar = `rm /tmp/${this.privateName}.tar`
    await exec(rmTar, Utils.setEcho(true))
  }
}

