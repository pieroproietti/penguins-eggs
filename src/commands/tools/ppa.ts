/**
 * ./src/commands/tools/ppa.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

/**
 * Debian 13 trixe, Ubuntu 24.04 noble usano il formato deb822
 * * esiste un comando per modernizzare le sorgenti:
 * sudo apt modernize-sources
 */


import { Command, Flags } from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'

import Distro from '../../classes/distro.js'
import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'
import Diversions from '../../classes/diversions.js'

const ppaKeyUrl = 'https://pieroproietti.github.io/penguins-eggs/key.asc'
const ppaKeyPath = '/usr/share/keyrings/penguins-eggs.gpg'
const ppaSourcesPath = '/etc/apt/sources.list.d/penguins-eggs' // Base path without extension

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
          Utils.warning(`Are you sure to add source ${path.basename(ppaSourcesPath)} to your repositories?`)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue...'))) {
            // Rimuove sempre le vecchie configurazioni per uno stato pulito
            await debianRemove()
            if (await is822()) {
              await debianAdd822()
            } else {
              await debianAdd()
            }
          }
        } else if (flags.remove) {
          Utils.warning(`Are you sure to remove source ${path.basename(ppaSourcesPath)} to your repositories?`)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue...'))) {
            await debianRemove()
          }
        }
        await exec('apt-get update')


        /**
         * Alle the others
         */
      } else {
        Utils.warning(`Distro: ${distro.distroId}/${distro.codenameId}, cannot use penguins-eggs-repo nor chaotic-aur!`)
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
 * debianAdd822 - For modern Debian/Ubuntu with .sources files
 */
async function debianAdd822() {
  // --- FIX: Correct GPG key URL ---
  await exec(`curl -fsSL ${ppaKeyUrl} | gpg --dearmor -o ${ppaKeyPath}`)
  
  let content = ''
  content += 'Types: deb\n'
  content += 'URIs: https://pieroproietti.github.io/penguins-eggs/deb\n' // Correct URI for packages
  content += 'Suites: stable\n' // It's better to be specific
  content += 'Components: main\n'
  content += `Signed-By: ${ppaKeyPath}\n`
  
  // --- IMPROVEMENT: Use the standard .sources extension ---
  fs.writeFileSync(`${ppaSourcesPath}.sources`, content)

  // --- IMPROVEMENT: Removed unnecessary `touch` command ---
}

/**
 * debianAdd - For traditional Debian/Ubuntu with .list files
 */
async function debianAdd() {
  // --- FIX: Correct GPG key URL and remove redundant sudo ---
  await exec(`curl -fsSL ${ppaKeyUrl} | gpg --dearmor -o ${ppaKeyPath}`)

  const content = `deb [signed-by=${ppaKeyPath}] https://pieroproietti.github.io/penguins-eggs/deb stable main\n`
  fs.writeFileSync(`${ppaSourcesPath}.list`, content)
}

/**
 * is822 (checks if the system uses the deb822 format)
 */
async function is822(): Promise<boolean> {
  let retval = false
  const test = `([ -f /etc/apt/sources.list.d/ubuntu.sources ] || [ -f /etc/apt/sources.list.d/debian.sources ]) && echo "1" || echo "0"`
  const is822Result = (await exec(test, { capture: true, echo: false }))
  if (is822Result.code === 0) {
    if (is822Result.data.trim() === '1') {
      retval = true
    }
  }
  return retval
}


/**
 * debianRemove - Cleans up all related PPA files
 */
async function debianRemove() {
  // The script runs as root, so sudo inside exec is not needed here
  await exec(`rm -f ${ppaKeyPath}`)
  await exec(`rm -f ${ppaSourcesPath}*`)
}