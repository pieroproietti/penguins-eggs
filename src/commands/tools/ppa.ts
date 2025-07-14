/**
 * ./src/commands/tools/ppa.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import fs from 'node:fs'

import Distro from '../../classes/distro.js'
import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'

const fkey = '/etc/apt/trusted.gpg.d/penguins-eggs-key.gpg'
const flist = '/etc/apt/sources.list.d/penguins-eggs-ppa.list'

/**
 *
 */
export default class Ppa extends Command {
  static description = 'add/remove repo'

  static examples = ['sudo eggs tools ppa --add', 'sudo eggs tools ppa --remove']

  static flags = {
    add: Flags.boolean({ char: 'a', description: 'add penguins-eggs PPA repository' }),
    help: Flags.help({ char: 'h' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    remove: Flags.boolean({ char: 'r', description: 'remove penguins-eggs PPA repository' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

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

    const { nointeractive } = flags

    if (Utils.isRoot()) {
      const distro = new Distro()

      /**
       * Debian
       */
      if (distro.familyId === 'debian') {
        if (flags.add) {
          Utils.warning(`Are you sure to add ${flist} to your repositories?`)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue...'))) {
            await debianAdd()
          }
        } else if (flags.remove) {
          Utils.warning(`Are you sure to remove ${flist} to your repositories?`)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue...'))) {
            await debianRemove()
          }
        }

        /**
         * archlinux
         */
      }

      if (distro.familyId === 'archlinux') {
        if (flags.add) {
          if (distro.distroId !== 'Manjarolinux') {
            Utils.warning(`Are you sure to add chaotic-aur to your repositories?`)
            if (await Utils.customConfirm('Select yes to continue...')) {
              await archAdd()
            }
          }
        } else if (flags.remove) {
          await archRemove()
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
 * archAdd
 */
async function archAdd() {
  const path = '/var/cache/pacman/pkg/'
  const keyring = 'chaotic-keyring.pkg.tar.zst'
  const mirrorlist = 'chaotic-mirrorlist.pkg.tar.zst'
  const echo = Utils.setEcho(true)

  if (fs.existsSync(path + keyring) && fs.existsSync(path + mirrorlist)) {
    console.log('repository chaotic-aur, already present!')
    await archRemove()
    process.exit()
  }

  await exec('pacman-key --recv-key FBA220DFC880C036 --keyserver keyserver.ubuntu.com', echo)
  await exec('pacman-key --lsign-key FBA220DFC880C036', echo)
  await exec("pacman -U 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst' 'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst'", echo)

  // Append to /etc/pacman.conf
  const chaoticAppend = '\n[chaotic-aur]\nInclude = /etc/pacman.d/chaotic-mirrorlist\n\n'
  fs.appendFileSync('/etc/pacman.conf', chaoticAppend)
}

/**
 * archRemove
 */
async function archRemove() {
  const path = '/var/cache/pacman/pkg/'
  const keyring = 'chaotic-keyring.pkg.tar.zst'
  const mirrorlist = 'chaotic-mirrorlist.pkg.tar.zst'
  const echo = Utils.setEcho(true)

  if (fs.existsSync(path + keyring) && fs.existsSync(path + mirrorlist)) {
    console.log('to remove chaotic-aur:\n')
    console.log(`sudo rm ${path}${keyring}`)
    console.log(`sudo rm ${path}${mirrorlist}`)
    console.log(`sudo nano /etc/pacman.conf`)
    console.log(`remove at the end:`)
    console.log(`[chaotic-aur]`)
    console.log(`Include = /etc/pacman.d/chaotic-mirrorlist`)
  }
}

/**
 * debianAdd
 */
async function debianAdd() {
  await exec(`curl -sS https://pieroproietti.github.io/penguins-eggs-ppa/KEY.gpg| gpg --dearmor | sudo tee ${fkey} > /dev/null`)
  const content = `deb [signed-by=${fkey}] https://pieroproietti.github.io/penguins-eggs-ppa ./\n`
  fs.writeFileSync(flist, content)
  await exec('apt-get update')
}

/**
 * debianRemove
 */
async function debianRemove() {
  await exec('rm -f /etc/apt/trusted.gpg.d/penguins-eggs*')
  await exec('rm -f /etc/apt/sources.list.d/penguins-eggs*')
  await exec('rm -f /usr/share/keyrings/penguins-eggs*')

  await exec('apt-get update')
}
