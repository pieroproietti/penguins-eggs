/**
 * ./src/commands/tools/ppa.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

/**
 * Debian 13 trixe, Ubuntu 24.04 noble usano il formato deb822
 * 
 * esiste un comando per modernizzare le sorgenti:
 * sudo apt modernize-sources
 */


import { Command, Flags } from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'

import Distro from '../../classes/distro.js'
import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'
import Diversions from '../../classes/diversions.js'

const ppaKey = '/etc/apt/trusted.gpg.d/penguins-eggs-key.gpg'
const ppaName = `/etc/apt/sources.list.d/penguins-eggs-ppa`
const ppaList = ppaName + '.list'
const ppaSources = ppaName + '.sources'

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
          Utils.warning(`Are you sure to add source ${path.basename(ppaName)} to your repositories?`)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue...'))) {
            if (await is822()) {
              debianAdd822()
            } else {
              await debianAdd()
            }
          }
        } else if (flags.remove) {
          Utils.warning(`Are you sure to remove source ${path.basename(ppaName)} to your repositories?`)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue...'))) {
            await debianRemove()
          }
        }


        /**
         * Arch and only Arch!  no Manjaro...
         */
      } else if (distro.familyId === 'archlinux' && !Diversions.isManjaroBased(distro.distroId)) {
        if (flags.add) {
          Utils.warning(`Are you sure to add Chaotic-AUR to your repositories?`)
          if (await Utils.customConfirm('Select yes to continue...')) {
            await archAdd()
          }
        } else if (flags.remove) {
          Utils.warning(`Are you sure to remove Chaotic-AUR to your repositories?`)
          if (await Utils.customConfirm('Select yes to continue...')) {
            await archRemove()
          }
        }


        /**
         * Alle the others
         */
      } else {
        Utils.warning(`Distro: ${distro.distroId}/${distro.codenameId}, cannot use penguins-eggs-ppa nor chaotic-aur!`)
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
    console.log('repository Chaotic-AUR, already present!')
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
 * debianAdd822
 */
async function debianAdd822() {
  await exec(`curl -sS https://pieroproietti.github.io/penguins-eggs-ppa/KEY.gpg| gpg --dearmor | sudo tee ${ppaKey} > /dev/null`)
  let content = ''
  content += 'Types: deb'
  content += 'URIs: https://pieroproietti.github.io/penguins-eggs-ppa'
  content += 'Suites: ./'
  content += 'Signed-By: /usr/share/keyrings/penguins-eggs-ppa.gpg'
  fs.writeFileSync(ppaSources, content)

  // crea un penguins-eggs-ppa.list vuoto
  await exec(`touch ${ppaList}`)
  await exec('apt-get update')
}

/**
 * debianAdd
 */
async function debianAdd() {
  await exec(`curl -sS https://pieroproietti.github.io/penguins-eggs-ppa/KEY.gpg| gpg --dearmor | sudo tee ${ppaKey} > /dev/null`)
  const content = `deb [signed-by=${ppaKey}] https://pieroproietti.github.io/penguins-eggs-ppa ./\n`
  fs.writeFileSync(ppaList, content)
  await exec('apt-get update')
}

/**
 * debianRemove
 */
async function debianRemove() {
  await exec(`rm -f ${ppaKey}`)
  await exec(`rm -f ${ppaList}`)
  await exec(`rm -f ${ppaSources}`)

  await exec('apt-get update')
}


/**
 * is822 (usa lo standard deb822 per le sorgenti)
 */
async function is822(): Promise<boolean> {
  const test = `([ -f /etc/apt/sources.list.d/ubuntu.sources ] || [ -f /etc/apt/sources.list.d/debian.sources ]) && echo "1" || echo "0"`
  const is822 = (await exec(test)).data
  if (is822 !== '1') {
    return false
  } else {
    return true
  }
}