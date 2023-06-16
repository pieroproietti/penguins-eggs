/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'
import Distro from '../../classes/distro'
import Utils from '../../classes/utils'
import { exec } from '../../lib/utils'
import fs from 'fs'

const fkey = '/etc/apt/trusted.gpg.d/penguins-eggs-key.gpg'
const flist = '/etc/apt/sources.list.d/penguins-eggs-ppa.list'

/**
 *
 */
export default class Ppa extends Command {

  static flags = {
    add: Flags.boolean({ char: 'a', description: 'add penguins-eggs PPA repository' }),
    help: Flags.help({ char: 'h' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    remove: Flags.boolean({ char: 'r', description: 'remove penguins-eggs PPA repository' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
  }

  static description = 'add/remove repo'
  static examples = [
    'sudo eggs tools ppa --add',
    'sudo eggs tools ppa --remove',
  ]

  /**
   * 
   */
  async run(): Promise<void> {
    const { flags } = await this.parse(Ppa)
    Utils.titles(this.id + ' ' + this.argv)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    const nointeractive = flags.nointeractive

    if (Utils.isRoot()) {
      const distro = new Distro()

      /**
       * Debian
       */
      if (distro.familyId === 'debian') {
        if (flags.remove) {
          Utils.warning(`Are you sure to remove ${flist} to your repositories?`)
          if (nointeractive || await Utils.customConfirm('Select yes to continue...')) {
            await remove()
          }
        }

        if (flags.add) {
          Utils.warning(`Are you sure to add ${flist} to your repositories?`)
          if (nointeractive || await Utils.customConfirm('Select yes to continue...')) {
            await clean()
            await add()
          }
        }

        /** 
         * archlinux
         */
      } if (distro.familyId === 'archlinux') {

        if (flags.add) {
          if (distro.distroId !== 'ManjaroLinux') {
            const path = "/var/cache/pacman/pkg/"
            const keyring = "chaotic-keyring.pkg.tar.zst"
            const mirrorlist = "chaotic-mirrorlist.pkg.tar.zst"
            const echo = Utils.setEcho(true)

            await exec(`rm ${path}${keyring}`, echo)
            await exec(`rm ${path}${mirrorlist}`, echo)
            if (fs.existsSync(path + keyring) && (fs.existsSync(path + mirrorlist))) {
              console.log("repository chaotic-aur already present!")
              process.exit()
            }
            await exec('pacman-key --recv-key FBA220DFC880C036 --keyserver keyserver.ubuntu.com', echo)
            await exec('pacman-key --lsign-key FBA220DFC880C036', echo)
            await exec("pacman -U 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst' 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst'", echo)
          }
        }

        if (flags.remove) {
          Utils.warning(`Are you sure to remove chaotic-aur to your repositories?`)
          if (nointeractive || await Utils.customConfirm('Select yes to continue...')) {
            console.log("not agan implemented!")
          }
        }

      } else {
        /**
         * Others
         */
        Utils.warning(`Distro> ${distro.distroId}/${distro.codenameId}, cannot use this command here!`)
      }
    }
  }
}

/**
 * add ppa
 */
async function add() {
  await exec(`curl -sS https://pieroproietti.github.io/penguins-eggs-ppa/KEY.gpg| gpg --dearmor | sudo tee ${fkey} > /dev/null`)
  const content = `deb [signed-by=${fkey}] https://pieroproietti.github.io/penguins-eggs-ppa ./\n`
  fs.writeFileSync(flist, content)
  await exec('apt-get update')
}

/**
 * remove ppa
 */
async function remove() {
  await clean()
  await exec('apt-get update')
}

/**
 *
 */
async function clean() {
  await exec('rm -f    /etc/apt/trusted.gpg.d/penguins-eggs*')
  await exec('rm -f /etc/apt/sources.list.d/penguins-eggs*')
  await exec('rm -f /usr/share/keyrings/penguins-eggs*')
}
