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
import Pacman from '../classes/pacman'

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

    let filesOld = [
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

    await this.prepare(user, verbose)
    await exec(`chown root:root /etc/skel -R`, echo)
  }


  /**
   * 
   */
  async prepare(user: string, verbose = false) {
    let echo = Utils.setEcho(verbose)

    if (verbose) {
      console.log('preparing /etc/skel\n')
    }

    let files = [
      '.profiles',
      '.bashrc',
      '.config',
      '.local',

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


    await exec(`rm -rf /etc/skel`)
    await exec(`mkdir -p /etc/skel`)

    // echo $XDG_CURRENT_DESKTOP

    if (Pacman.packageIsInstalled('cinnamon-core')) {
      files.push('.cinnamon')
    }

    if (Pacman.packageIsInstalled('lxde-core')) {
      files.push('.lxde')
    }

    if (Pacman.packageIsInstalled('lxqt-core')) {
      files.push('.lxqt')
    }



    for (let i in files) {
      if (fs.existsSync(`/home/${user}/${files[i]}`)) {
        await exec(`cp -r /home/${user}/${files[i]} /etc/skel/ `, echo)
      }
    }

    /**
     * cleaning
     */

    // .config
    await this.deleteIfExist(`/etc/skel/.config/chromium`, verbose)
    await this.deleteIfExist(`/etc/skel/.config/midori/cookies.*`, verbose)
    await this.deleteIfExist(`/etc/skel/.config/midori/history.*`, verbose)
    await this.deleteIfExist(`/etc/skel/.config/midori/tabtrash.*`, verbose)
    await this.deleteIfExist(`/etc/skel/.config/midori/running*`, verbose)
    await this.deleteIfExist(`/etc/skel/.config/midori/bookmarks.*`, verbose)
    await this.deleteIfExist(`/etc/skel/.config/user-dirs.*`, verbose)

    // .gconf
    await this.deleteIfExist(`/etc/skel/.gconf/system/networking`, verbose)

    // .local
    await this.deleteIfExist(`/etc/skel/.local/gvfs-metadata`, verbose)
    await this.deleteIfExist(`/etc/skel/.local/share/gvfs-metadata`, verbose)
    await this.deleteIfExist(`/etc/skel/.local/share/applications/wine-*`, verbose)
    await this.deleteIfExist(`/etc/skel/.local/share/Trash`, verbose)
    await this.deleteIfExist(`/etc/skel/.local/share/akonadi`, verbose)
    await this.deleteIfExist(`/etc/skel/.local/share/webkit`, verbose)

    // kde
    await this.deleteIfExist(`/etc/skel/.kde/share/apps/klipper`, verbose)
    await this.deleteIfExist(`/etc/skel/.kde/share/apps/nepomuk`, verbose)
    await this.deleteIfExist(`/etc/skel/.kde/share/apps/RecentDocuments/*`, verbose)

    // others
    let cmd = ''
    cmd = `for i in /etc/skel/.gnome2/keyrings/*; do rm ${user}; done`
    //await shx(cmd, verbose)

    cmd = `find /etc/skel/ | grep "${user}" | xargs rm -rf '{}'`
    await shx(cmd, verbose)

    cmd = `find /etc/skel/ -name "*socket*" | xargs rm -rf '{}'`
    await shx(cmd, verbose)

    cmd = `find /etc/skel/ -name "*cache*" | xargs rm -rf '{}'`
    await shx(cmd, verbose)

    cmd =`grep -Rl "${user}" /etc/skel | xargs rm -rf '{}'`
    await shx(cmd, verbose)

  }

  /**
   * 
   * @param file 
   */
  async deleteIfExist(file: string, verbose = false) {
    let echo = Utils.setEcho(verbose)

    if (fs.existsSync(file)) {
      await exec(`rm -rf ${file}`, echo)
    }
  }
}

async function shx (cmd: string ,verbose=false){
  let echo = Utils.setEcho(verbose)

  if (verbose) console.log(cmd)
  await exec (cmd, echo )
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

