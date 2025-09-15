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

const ppaKey = '/usr/share/keyrings/penguins-eggs-ppa.gpg'
//             '/etc/apt/trusted.gpg.d/penguins-eggs-key.gpg'
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

      if (distro.familyId === 'archlinux' && !Diversions.isManjaroBased(distro.distroId)) {
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

      } else if (distro.familyId === 'debian') {
        /**
         * Debian
         */
        if (flags.add) {
          Utils.warning(`Are you sure to add source ${path.basename(ppaName)} to your repositories?`)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue...'))) {
            // remove old penguins-eggs-ppa.list
            debianRemove()
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
        await exec('apt-get update')


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
  
  // await exec(`curl -sS https://pieroproietti.github.io/penguins-eggs-ppa/KEY.gpg| gpg --dearmor | sudo tee ${ppaKey} > /dev/null`)
  await exec(`curl -fsSL https://pieroproietti.github.io/penguins-eggs/penguins-eggs.asc | sudo gpg --dearmor -o /usr/share/keyrings/penguins-eggs-keyring.gpg > /dev/null`)
  let content = ''
  content += 'Types: deb\n'
  content += 'URIs: https://pieroproietti.github.io/penguins-eggs-ppa\n'
  content += 'Suites: ./\n'
  content += 'Signed-By: /usr/share/keyrings/penguins-eggs-ppa.gpg\n'
  fs.writeFileSync(ppaSources, content)

  // crea un penguins-eggs-ppa.list vuoto
  await exec(`touch ${ppaList}`)
}

/**
 * debianAdd
 */
async function debianAdd() {
  await exec (`sudo rm -f /usr/share/keyrings/penguins-eggs-keyring.gpg`)
  await exec(`curl -fsSL https://pieroproietti.github.io/penguins-eggs/penguins-eggs.asc | sudo gpg --dearmor -o /usr/share/keyrings/penguins-eggs-keyring.gpg > /dev/null`)
  const content ="deb [signed-by=/usr/share/keyrings/penguins-eggs-keyring.gpg] https://pieroproietti.github.io/penguins-eggs/deb stable main\n"
  fs.writeFileSync(ppaList, content)
}

/**
 * is822 (usa lo standard deb822 per le sorgenti)
 */
async function is822(): Promise<boolean> {
  await exec(`curl -sS https://pieroproietti.github.io/penguins-eggs-ppa/KEY.gpg| gpg --dearmor | sudo tee ${ppaKey} > /dev/null`)

  let retval = false
  const test = `([ -f /etc/apt/sources.list.d/ubuntu.sources ] || [ -f /etc/apt/sources.list.d/debian.sources ]) && echo "1" || echo "0"`
  const is822 = (await exec(test, { capture: true, echo: false, ignore: false }))
  if (is822.code === 0) {
    if (is822.data.trim() === '1') {
      retval = true
    }
  }
  return false
}


/**
 * debianRemove
 */
async function debianRemove() {
  await exec(`rm -f ${ppaKey}`)
  await exec(`rm -f ${ppaList}`)
  await exec(`rm -f ${ppaSources}`)
}


