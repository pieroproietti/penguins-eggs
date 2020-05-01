/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import Utils from '../classes/utils'
import chalk = require('chalk')
import fs = require('fs')

const exec = require('../lib/utils').exec


export default class Skel extends Command {
  static description = 'update skel from home configuration'

  static examples = [
    `$ eggs skel --user mauro
desktop configuration of user mauro will get used as default`]


  static flags = {
    help: flags.help({ char: 'h' }),
    user: flags.string({ char: 'u', description: 'user to be used' }),
    verbose: flags.boolean({ char: 'v' }),
  }


  async run() {
    const { flags } = this.parse(Skel)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    let user = ''
    if (flags.user) {
      user = flags.user
    } else {
      user = Utils.getPrimaryUser()
    }
    Utils.warning(`user: ${user}`)

    let source = ''
    if (fs.existsSync(`/home/${user}`)) {
      source = `/home/${user}`
    } else {
      Utils.error(`User ${user} not exist or not a proper home`)
      Utils.warning(`terminate`)
      process.exit(0)
    }

    if (Utils.isRoot()) {
      Utils.titles('skel')
      this.skel(user, verbose)
    }
  }

  /**
   * 
   * @param verbse 
   */
  async skel(user: string, verbose = false) {
    let files = [
      '.bacon',
      '.bashrc',
      '.config',
      '.gconf',
      '.gnome2',
      '.local',
      '.icewm*',
      '.fvwm*',
      '.profile',
      '.afterstep*',
      '.gtkrc*',
      '.cinnamon',
      '.mate*',
      '.qt*',
      '.kde*',
      '.razor',
      '.wbar',
      '.mplayer']

    let echo = Utils.setEcho(verbose)

    this.prepareSkel(files, verbose)
    this.copy2Skel(user, files, verbose)
    this.cleaningSkel(verbose)
    // await exec (`grep -Rl "$SKELUSER" /etc/skel | xargs rm -rf '{}'`, echo)
    await exec(`chown -R root:root /etc/skel`, echo)
  }


  /**
   * 
   */
  async prepareSkel(files: string[], verbose = false) {
    let echo = Utils.setEcho(verbose)

    if (verbose) {
      console.log('preparing /etc/skel')
    }

    for (let i in files) {
      if (fs.existsSync(`/etc/skel/${files[i]}`)) {
        await exec(`rm -rf /etc/skel/${files[i]}`, echo)
      }
    }
  }

  /**
   * 
   * @param verbose 
   */
  async copy2Skel(user: string, files: string[], verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('copying to /etc/skel')
    }

    for (let i in files) {
      if (fs.existsSync(`/home/${user}/files[i]`)) {
        await exec(`rsync -a /home/${user}/files[i] /etc/skel/`)
      }
    }
  }

  /**
   * 
   * @param verbose 
   */
  async cleaningSkel(verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log("Cleaning skel...")
    }

    await this.deleteIfExist(`/etc/skel/.config/chromium`, verbose)
    await this.deleteIfExist(`/etc/skel/.config/midori/cookies.*`, verbose)
    await this.deleteIfExist(`/etc/skel/.config/midori/history.*`, verbose)
    await this.deleteIfExist(`/etc/skel/.config/midori/tabtrash.*`, verbose)
    await this.deleteIfExist(`/etc/skel/.config/midori/running*`, verbose)
    await this.deleteIfExist(`/etc/skel/.config/midori/bookmarks.*`, verbose)
    await this.deleteIfExist(`/etc/skel/.config/user-dirs.*`, verbose)

    await this.deleteIfExist(`/etc/skel/.gconf/system/networking`, verbose)

    await this.deleteIfExist(`/etc/skel/.local/gvfs-metadata`, verbose)
    await this.deleteIfExist(`/etc/skel/.local/share/gvfs-metadata`, verbose)
    await this.deleteIfExist(`/etc/skel/.local/share/applications/wine-*`, verbose)
    await this.deleteIfExist(`/etc/skel/.local/share/Trash`, verbose)
    await this.deleteIfExist(`/etc/skel/.local/share/akonadi`, verbose)
    await this.deleteIfExist(`/etc/skel/.local/share/webkit`, verbose)

    await this.deleteIfExist(`/etc/skel/.kde/share/apps/klipper`, verbose)
    await this.deleteIfExist(`/etc/skel/.kde/share/apps/nepomuk`, verbose)
    await this.deleteIfExist(`/etc/skel/.kde/share/apps/RecentDocuments/*`, verbose)

  }

  /**
   * 
   * @param file 
   */
  async deleteIfExist(file: string, verbose=false){
    let echo = Utils.setEcho(verbose)

    if (fs.existsSync(file)){
      await exec(`rm -rf ${file}`, echo)
    }
  }
}


/**
# remastersys-skelcopy script to copy user data to /etc/skel
#  https://raw.githubusercontent.com/mutse/remastersys/master/remastersys/src/remastersys-skelcopy
#
#
#  Created by Tony "Fragadelic" Brijeski
#
#  Copyright 2011,2012 Under the GNU GPL2 License
#
#  Created November 23, 2011
#
*/

