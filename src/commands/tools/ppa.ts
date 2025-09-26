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

const ppaKeyUrl = 'https://pieroproietti.github.io/penguins-eggs-repo/KEY.asc'
const ppaKeyPath = '/usr/share/keyrings/penguins-eggs-repo.gpg'
const ppaUrl = `https://pieroproietti.github.io/penguins-eggs-repo`
let ppaPath = '/etc/apt/sources.list.d/penguins-eggs-repo' // Base path without extension

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
          Utils.warning(`Are you sure to add penguins-eggs-repo to your repositories?`)
          if (await Utils.customConfirm('Select yes to continue...')) {
            await penguinsRepoAdd()
          }
        } else if (flags.remove) {
          Utils.warning(`Are you sure to remove Chaotic-AUR to your repositories?`)
          if (await Utils.customConfirm('Select yes to continue...')) {
            await penguinsRepoRemove()
          }
        }

      } else if (distro.familyId === 'debian') {
        /**
         * Debian
         */
        if (flags.add) {
          Utils.warning(`Are you sure to add source ${path.basename(ppaPath)} to your repositories?`)
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
          Utils.warning(`Are you sure to remove source ${path.basename(ppaPath)} to your repositories?`)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue...'))) {
            await debianRemove()
          }
        }
        await exec('apt-get update')

      } else if (distro.familyId === 'fedora') {
        if (distro.distroId !== 'Fedora') {
          console.log("You can find the step-by-step instructions at this link:")
          console.log("https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/INSTALL-ENTR.md")
          console.log()
        } else {
          console.log("You can find the step-by-step instructions at this link:")
          console.log("https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/INSTALL-FEDORA.md")
          console.log()
        }
      } else if (distro.familyId === 'opensuse') {
        console.log("You can find the step-by-step instructions at this link:")
        console.log("https://github.com/pieroproietti/penguins-eggs/blob/master/DOCS/INSTALL-ENTERPRISE-LINUX.md")
        console.log()

        /**
         * All the others
         */
      } else {
        Utils.warning(`Distro: ${distro.distroId}/${distro.codenameId}, cannot use penguins-eggs-repo nor chaotic-aur!`)
      }
    }
  }
}


/**
 * PENGUINS-EGGS-REPO (ARCH)
 */
async function penguinsRepoAdd() {
  const repoBlockIdentifier = '# Penguins-eggs repository';
  const repoName = '[penguins-eggs]'
  const keyId = 'F6773EA7D2F309BA3E5DE08A45B10F271525403F'
  const serverUrl = 'https://pieroproietti.github.io/penguins-eggs-repo/arch'
  const pacmanConfPath = '/etc/pacman.conf'
  const echo = Utils.setEcho(true)

  // 1. Controlla se il repository è già configurato
  const pacmanConfContent = fs.readFileSync(pacmanConfPath, 'utf8');
  if (pacmanConfContent.includes(repoName)) {
    console.log(`Il repository ${repoName} è già presente in ${pacmanConfPath}!`);
    // Qui potresti voler uscire o chiamare una funzione di rimozione, come nel tuo esempio.
    return;
  }

  // 2. Importa e firma la chiave GPG del repository
  console.log(`Importazione della chiave GPG: ${keyId}...`);
  await exec(`pacman-key --recv-key ${keyId} --keyserver keyserver.ubuntu.com`, echo);
  await exec(`pacman-key --lsign-key ${keyId}`, echo);

  let repoBlock = ``
  repoBlock += repoBlockIdentifier + `\n`
  repoBlock += `${repoName}\n`
  repoBlock += `SigLevel = Optional TrustAll\n`
  repoBlock += `Server = ${serverUrl}\n`
  fs.appendFileSync(pacmanConfPath, repoBlock);
}

/**
 * Rimuove il repository penguins-eggs da /etc/pacman.conf
 */
async function penguinsRepoRemove() {
  // --- Configurazione del repository da rimuovere ---
  const repoBlockIdentifier = '# Penguins-eggs repository'
  const repoName = '[penguins-eggs]'
  const serverUrl = 'https://pieroproietti.github.io/penguins-eggs-repo/arch'
  const serverLine = 'Server = https://pieroproietti.github.io/penguins-eggs-repo/arch'
  const pacmanConfPath = '/etc/pacman.conf'

  let pacmanConfContent = fs.readFileSync(pacmanConfPath, 'utf8');

  // Controlla se il repository è effettivamente presente
  if (pacmanConfContent.includes(repoName)) {
    console.log(`Rimozione del repository ${repoName} in corso...`);

    // Costruisce la stringa esatta del blocco da rimuovere
    let repoBlock = ``
    repoBlock += repoBlockIdentifier + `\n`
    repoBlock += `${repoName}\n`
    repoBlock += `SigLevel = Optional TrustAll\n`
    repoBlock += `Server = ${serverUrl}\n`


    // Sostituisce il blocco del repository con una stringa vuota
    pacmanConfContent = pacmanConfContent.replace(repoBlock, '');

    // Riscrive il file con il contenuto aggiornato, usando trim() per
    // rimuovere eventuali spazi o righe vuote all'inizio o alla fine.
    fs.writeFileSync(pacmanConfPath, pacmanConfContent.trim());

    console.log('Repository rimosso con successo!');
    console.log('Esegui "sudo pacman -Syyu" per aggiornare i database.');

  } else {
    console.log('Il repository non era presente in /etc/pacman.conf.');
  }
}
/**
 * ARCH
 */
// archAdd
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

// archRemove
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
 * DEBIAN
 */
// is822
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

// debianAdd822
async function debianAdd822() {
  await exec(`curl -fsSL ${ppaKeyUrl} | gpg --dearmor -o ${ppaKeyPath}`)

  let content = ''
  content += `Types: deb\n`
  content += `URIs: ${ppaUrl}/deb\n` // Correct URI for packages
  content += `Suites: stable\n` // It's better to be specific
  content += `Components: main\n`
  content += `Signed-By: ${ppaKeyPath}\n`

  fs.writeFileSync(`${ppaPath}.sources`, content)
}

// debianAdd
async function debianAdd() {
  await exec(`curl -fsSL ${ppaKeyUrl} | gpg --dearmor -o ${ppaKeyPath}`)

  const content = `deb [signed-by=${ppaKeyPath}] ${ppaUrl}/deb stable main\n`
  fs.writeFileSync(`${ppaPath}.list`, content)
}

//  debianRemove
async function debianRemove() {
  // The script runs as root, so sudo inside exec is not needed here
  await exec(`rm -f ${ppaKeyPath}`)
  await exec(`rm -f ${ppaPath}*`)
}


