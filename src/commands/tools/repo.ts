/**
 * ./src/commands/tools/repo.ts
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
import Diversions from '../../classes/diversions.js'

const repoUrl = `https://penguins-eggs.net/repos`       // no slash at end
const repoKeyUrl = repoUrl + '/KEY.asc'

let repoPath = '/etc/apt/sources.list.d/penguins-repos' // Base path without extension
const repoKeyPath = '/usr/share/keyrings/penguins-repos.gpg'

// Alpine
const alpineRepoUrl = repoUrl + '/alpine/'
const alpineKeyName = 'piero.proietti@gmail.com-662b958c'
const alpineKeyUrl = repoUrl + `/alpine/${alpineKeyName}.rsa.pub`
const alpineKeyPath = `/etc/apk/keys/${alpineKeyName}.rsa.pub`
const alpineRepoFile = '/etc/apk/repositories'

// RPM (Fedora/EL)
const rpmKeyUrl = repoKeyUrl
const rpmKeyOwner = 'piero.proietti@gmail.com' // Per cercare e rimuovere la chiave
const rpmRepoFilePath = '/etc/yum.repos.d/penguins-eggs.repo' // Percorso di destinazione
const rpmRepoFedoraUrl = repoUrl + '/rpm/fedora/42'
const rpmRepoEl9Url = repoUrl + '/rpm/el9'

// RPM (openSUSE)
const opensuseKeyUrl = repoKeyUrl
const opensuseRepoUrl = repoUrl + '/rpm/opensuse/leap'
const opensuseRepoFilePath = '/etc/zypp/repos.d/penguins-eggs.repo' // NUOVO
const opensuseKeyOwner = rpmKeyOwner // RIUTILIZZA



/**
 *
 */
export default class Repo extends Command {
  static description = 'add/remove penguins-repos'

  static examples = ['sudo eggs tools repo --add', 'sudo eggs tools repo --remove']

  static flags = {
    add: Flags.boolean({ char: 'a', description: 'add penguins-repos' }),
    help: Flags.help({ char: 'h' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    remove: Flags.boolean({ char: 'r', description: 'remove penguins-repos' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  /**
   *
   */
  async run(): Promise<void> {
    const { flags } = await this.parse(Repo)
    Utils.titles(this.id + ' ' + this.argv)

    const { nointeractive } = flags

    if (Utils.isRoot()) {
      const distro = new Distro()
      const msgReposAdd = 'Are you sure you want to add https://penguins-eggs.net/repos to your repositories?'
      const msgReposRemove = 'Are you sure to remove https://penguins-eggs.net/repos to your repositories?'

      if (distro.familyId === 'alpine') {
        /**
         * Alpine
         */
        if (flags.add) {
          Utils.warning(msgReposAdd)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue'))) {
            await alpineRepoAdd()
          }
        } else if (flags.remove) {
          Utils.warning(msgReposRemove)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue'))) {
            await alpineRepoRemove()
          }
        }
        await exec('apk update')

      } else if (distro.familyId === 'archlinux') {
        if (flags.add) {
          Utils.warning(msgReposAdd)
          if (await Utils.customConfirm('Select yes to continue')) {
            await archlinuxRepoAdd(distro.distroId)
          }
        } else if (flags.remove) {
          Utils.warning(msgReposRemove)
          if (await Utils.customConfirm('Select yes to continue')) {
            await archlinuxRepoRemove(distro.distroId)
          }
        }


      } else if (distro.familyId === 'debian') {
        /**
         * Debian
         */
        if (flags.add) {
          Utils.warning(msgReposAdd)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue'))) {
            await debianRemove()
            if (await debianIs822()) {
              await debianAdd822()
            } else {
              await debianAdd()
            }
          }
        } else if (flags.remove) {
          Utils.warning(msgReposRemove)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue'))) {
            await debianRemove()
          }
          await exec('apt-get update')
        }

      } else if (distro.familyId === 'fedora') {
        /**
         * RPM (Fedora/EL)
         */
        let repoUrl = rpmRepoFedoraUrl
        if (distro.distroId !== 'Fedora') {
          // RHEL9
          repoUrl = rpmRepoEl9Url
        }

        if (flags.add) {
          Utils.warning(msgReposAdd)
          if (nointeractive || (await Utils.customConfirm('Seleziona sì per continuare...'))) {
            await rpmRepoAdd(repoUrl, rpmKeyUrl)
          }
        } else if (flags.remove) {
          Utils.warning(msgReposRemove)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue'))) {
            await rpmRepoRemove(rpmRepoFilePath, rpmKeyOwner)
          }
        }
        await exec('dnf check-update')

      } else if (distro.familyId === 'opensuse') {
        /**
         * openSUSE
         */
        if (flags.add) {
          Utils.warning(msgReposAdd)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue'))) {
            // Passiamo sia repoUrl che keyUrl
            await opensuseRepoAdd(opensuseRepoUrl, opensuseKeyUrl)
          }
        } else if (flags.remove) {
          Utils.warning(msgReposRemove)
          if (nointeractive || (await Utils.customConfirm('Select yes to continue'))) {
            // RIUTILIZZIAMO la funzione di rimozione di Fedora!
            await rpmRepoRemove(opensuseRepoFilePath, opensuseKeyOwner)
          }
        }
        // Aggiungiamo un refresh finale
        await exec('zypper refresh')

      } else {
        /**
         * All the others
         */
        Utils.warning(`Distro: ${distro.distroId}/${distro.codenameId}, cannot use penguins-eggs.net/repos nor chaotic-aur!`)
      }
    }
  }
}




/** ===============================================
 *  ALPINE
 *  ===============================================
 */

/**
 * alpineRepoAdd()
 */
async function alpineRepoAdd() {
  console.log('Adding Alpine repository...')
  const echo = Utils.setEcho(true)

  if (fs.existsSync(alpineKeyPath)) {
    console.log('Chiave già esistente.')
  } else {
    await exec(`curl -fsSL ${alpineKeyUrl} -o ${alpineKeyPath}`, echo)
  }

  const repoFileContent = fs.readFileSync(alpineRepoFile, 'utf8')
  if (repoFileContent.includes(alpineRepoUrl)) {
    console.log('La linea del repository è già presente in /etc/apk/repositories.')
  } else {
    fs.appendFileSync(alpineRepoFile, `\n${alpineRepoUrl}\n`)
    console.log('Repository aggiunto.')
  }
  console.log('Esegui "apk update" per aggiornare i repository.')
}

/**
 * alpineRepoRemove()
 */
async function alpineRepoRemove() {
  console.log('Rimozione repository Alpine...')
  const echo = Utils.setEcho(true)

  // Rimuovi chiave
  if (fs.existsSync(alpineKeyPath)) {
    await exec(`rm -f ${alpineKeyPath}`, echo)
    console.log('Chiave del repository rimossa.')
  } else {
    console.log('Chiave del repository non trovata.')
  }

  // Rimuovi da /etc/apk/repositories
  if (fs.existsSync(alpineRepoFile)) {
    let content = fs.readFileSync(alpineRepoFile, 'utf8')
    if (content.includes(alpineRepoUrl)) {
      const newLines = content.split('\n').filter(line => line.trim() !== alpineRepoUrl)
      fs.writeFileSync(alpineRepoFile, newLines.join('\n'))
      console.log('Linea del repository rimossa da /etc/apk/repositories.')
    } else {
      console.log('Linea del repository non trovata in /etc/apk/repositories.')
    }
  }
  console.log('Esegui "apk update" per aggiornare i repository.')
}




/** ===============================================
 *  ARCH
 *  ===============================================
 */

/**
 * archlinuxRepoAdd()
 */
async function archlinuxRepoAdd(distroId = "Arch") {
  console.log(`Adding penguins-repos for ${distroId}`)

  const repoBlockIdentifier = '# penguins-repos';
  const repoName = '[penguins-eggs]'
  const keyId = 'F6773EA7D2F309BA3E5DE08A45B10F271525403F'
  let serverUrl = repoUrl + '/arch'
  if (Diversions.isManjaroBased(distroId)) {
    serverUrl = repoUrl + '/manjaro'
  }
  const pacmanConfPath = '/etc/pacman.conf'
  const echo = Utils.setEcho(true)

  const pacmanConfContent = fs.readFileSync(pacmanConfPath, 'utf8');
  if (pacmanConfContent.includes(repoName)) {
    console.log(`The repository ${repoName} already exists in ${pacmanConfPath}!`)
    return;
  }

  console.log(`Importazione della chiave GPG: ${keyId}...`);
  await exec(`pacman-key --recv-key ${keyId} --keyserver keyserver.ubuntu.com`, echo);
  await exec(`pacman-key --lsign-key ${keyId}`, echo);

  let repoBlock = ``
  repoBlock += repoBlockIdentifier + `\n`
  repoBlock += `${repoName}\n`
  repoBlock += `SigLevel = Optional TrustAll\n`
  repoBlock += `Server = ${serverUrl}\n`
  fs.appendFileSync(pacmanConfPath, repoBlock)

  let message = 'Run “sudo pacman -Syyu” to update pacman databases.'
  if (Diversions.isManjaroBased(distroId)) {
    message = 'Run “sudo pamac update --force-refresh" to update pacman databases.'
  }
  console.log('Repository successfully removed!');
  console.log(message);
}


/**
 * archlinuxRepoRemove()
 * @param distroId 
 */
async function archlinuxRepoRemove(distroId = 'Arch') {
  console.log(`Removing penguins-repos for ${distroId}`)

  const repoBlockIdentifier = '# penguins-repos'
  const repoName = '[penguins-eggs]'
  let serverUrl = repoUrl + '/arch'
  if (Diversions.isManjaroBased(distroId)) {
    serverUrl = repoUrl + '/manjaro'
  }
  const pacmanConfPath = '/etc/pacman.conf'

  let pacmanConfContent = fs.readFileSync(pacmanConfPath, 'utf8');

  if (pacmanConfContent.includes(repoName)) {
    console.log(`Removing repository ${repoName} in progress...`);

    let repoBlock = ``
    repoBlock += repoBlockIdentifier + `\n`
    repoBlock += `${repoName}\n`
    repoBlock += `SigLevel = Optional TrustAll\n`
    repoBlock += `Server = ${serverUrl}\n`


    pacmanConfContent = pacmanConfContent.replace(repoBlock, '');

    fs.writeFileSync(pacmanConfPath, pacmanConfContent.trim());

    let message = 'Run “sudo pacman -Syyu” to update pacman databases.'
    if (Diversions.isManjaroBased(distroId)) {
      message = 'Run “sudo pamac update --force-refresh" to update pacman databases.'
    }
    console.log('Repository successfully removed!');
    console.log(message);

  } else {
    console.log('The repository was not present in /etc/pacman.conf.');
  }
}


/**
 * archlinuxAurAdd()
 */
async function archlinuxAurAdd() {
  const path = '/var/cache/pacman/pkg/'
  const keyring = 'chaotic-keyring.pkg.tar.zst'
  const mirrorlist = 'chaotic-mirrorlist.pkg.tar.zst'
  const echo = Utils.setEcho(true)

  if (fs.existsSync(path + keyring) && fs.existsSync(path + mirrorlist)) {
    console.log('repository Chaotic-AUR, already present!')
    await archlinuxAurRemove()
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
 * archlinuxAurRemove()
 */
async function archlinuxAurRemove() {
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



/** ===============================================
 *  DEBIAN
 *  ===============================================
 */

/**
 * debianAdd()
 */
async function debianAdd() {
  await exec(`curl -fsSL ${repoKeyUrl} | gpg --dearmor -o ${repoKeyPath}`)

  const content = `deb [signed-by=${repoKeyPath}] ${repoUrl}/deb stable main\n`
  fs.writeFileSync(`${repoPath}.list`, content)
}

/**
 * debianRemove()
 */
async function debianRemove() {
  await exec(`rm -f ${repoKeyPath}`)
  await exec(`rm -f ${repoPath}*`)
}

/**
 * debianIs822()
 **/
async function debianIs822(): Promise<boolean> {
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
 * debianAdd822()
 */
async function debianAdd822() {
  await exec(`curl -fsSL ${repoKeyUrl} | gpg --dearmor -o ${repoKeyPath}`)

  let content = ''
  content += `Types: deb\n`
  content += `URIs: ${repoUrl}/deb\n` // Correct URI for packages
  content += `Suites: stable\n` // It's better to be specific
  content += `Components: main\n`
  content += `Signed-By: ${repoKeyPath}\n`

  fs.writeFileSync(`${repoPath}.sources`, content)
}


/** ===============================================
 *  Fedora/EL9
 *  ===============================================
 */

/**
 * rpmRepoAdd()
 * @param repoUrl 
 * @param keyUrl 
 */
/**
 * rpmRepoAdd()
 * @param repoUrl 
 * @param keyUrl 
 */
async function rpmRepoAdd(repoUrl: string, keyUrl: string) {
  console.log(`Adding RPM repository for ${repoUrl}...`);
  const echo = Utils.setEcho(true);

  // 1. Definisci il contenuto del file .repo
  const repoContent = `
[penguins-eggs]
name=penguins-eggs.net repos
baseurl=${repoUrl}
enabled=1
gpgcheck=1
gpgkey=${keyUrl}
`;
  // keyUrl (https://penguins-eggs.net/repos/KEY.asc) è già corretto per il campo gpgkey

  try {
    // 2. Scrivi il file .repo
    fs.writeFileSync(rpmRepoFilePath, repoContent.trim());
    console.log(`Repository file created at ${rpmRepoFilePath}`);

    // 3. Importa la chiave GPG nel database RPM
    // (dnf lo farebbe comunque, ma importarlo è più pulito)
    await exec(`rpm --import ${keyUrl}`, echo);
    console.log(`GPG key imported from ${keyUrl}`);

    // 4. Pulisci la cache per forzare l'aggiornamento
    await exec('dnf clean metadata', echo);

    console.log('Repository added. Use "dnf check-update" to refresh.');

  } catch (error: any) {
    console.error(`Failed to add RPM repository: ${error.message}`);
  }
}

/**
 * rpmRepoRemove()
 * @param repoFilePath 
 * @param keyOwner 
 */
async function rpmRepoRemove(repoFilePath: string, keyOwner: string) {
  console.log('Removing RPM repo...')
  const echo = Utils.setEcho(true)

  // Rimuovi file .repo
  if (fs.existsSync(repoFilePath)) {
    await exec(`rm -f ${repoFilePath}`, echo)
    console.log(`Removed ${repoFilePath}.`)
  } else {
    console.log(`File repository ${repoFilePath} not found.`)
  }

  // Rimuovi chiave GPG
  const findKeyCmd = `rpm -q gpg-pubkey --qf '%{name}-%{version}-%{release} %{summary}\n' | grep '${keyOwner}' | cut -d' ' -f1`
  const keyNameResult = await exec(findKeyCmd, { capture: true, echo: false })

  if (keyNameResult.code === 0 && keyNameResult.data.trim() !== '') {
    const keyNames = keyNameResult.data.trim().split('\n')
    for (const keyName of keyNames) {
      if (keyName) {
        console.log(`Rimozione chiave GPG ${keyName}...`)
        await exec(`rpm -e ${keyName}`, echo)
      }
    }
  } else {
    console.log('No GPG key to remove.')
  }

  console.log('Repository removed. Use "dnf check-update" to refresh.')
}





/** ===============================================
 * Opensuse
 * ===============================================
 */

/**
 * opensuseRepoAdd()
 * @param repoUrl 
 * @param keyUrl 
 */
async function opensuseRepoAdd(repoUrl: string, keyUrl: string) {
  console.log(`Adding repository openSUSE ${repoUrl}`)
  const echo = Utils.setEcho(true)

  // 1. Definisci il contenuto del file .repo
  const repoContent = `
[penguins-eggs]
name=penguins-eggs.net repos
baseurl=${repoUrl}
enabled=1
gpgcheck=1          
repo_gpgcheck=0
gpgkey=${keyUrl}
autorefresh=1
`;
// gpgcheck=1 -> Controlla i pacchetti RPM (corretto)
// repo_gpgcheck=0 -> NON controllare i metadati/repomd.xml (risolve il prompt)

  try {
    // 2. Scrivi il file .repo nella directory di zypper
    fs.writeFileSync(opensuseRepoFilePath, repoContent.trim());
    console.log(`Repository file created at ${opensuseRepoFilePath}`);

    // 3. Importa la chiave GPG nel database RPM (stesso comando di Fedora)
    await exec(`rpm --import ${keyUrl}`, echo);
    console.log(`GPG key imported from ${keyUrl}`);
    
    console.log('Repository added. Use "zypper refresh" to update.');

  } catch (error: any) {
    console.error(`Failed to add openSUSE repository: ${error.message}`);
  }
}