/**
 * ./src/classes/incubation/incubator.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// pjson
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const pjson = require('../../../package.json')

// partition
import yaml from 'js-yaml'
import fs from 'node:fs'
import path from 'node:path'
import shx from 'shelljs'
import { exec } from '../../lib/utils.js'

import { CalamaresPartitionConfig } from '../../interfaces/i-calamares-partition.js'
import { IInstaller } from '../../interfaces/i-installer.js'
import { IDistro, IRemix } from '../../interfaces/index.js'
import Pacman from '../pacman.js'
import Utils from '../utils.js'
import { installer } from './installer.js'
import { branding } from './branding.js'

// incubator.d
import { Alpine } from './incubator.d/alpine.js'
import { Bionic } from './incubator.d/bionic.js'
import { Buster } from './incubator.d/buster.js'
import { Jessie } from './incubator.d/jessie.js'
import { Fedora } from './incubator.d/fedora.js'
import { Noble } from './incubator.d/noble.js'
import { Openmamba } from './incubator.d/openmamba.js'
import { Opensuse } from './incubator.d/opensuse.js'
import { Rolling } from './incubator.d/rolling.js'
import e from 'express'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 *
 */
export default class Incubator {
  distro: IDistro

  installer = {} as IInstaller

  isClone: boolean

  remix: IRemix

  theme: string

  user_opt: string

  verbose = false

  /**
   *
   * @param remix
   * @param distro
   * @param verbose
   */
  constructor(remix: IRemix, distro: IDistro, user_opt = 'live', theme = 'eggs', isClone = false, verbose = false) {
    this.installer = installer()
    this.remix = remix
    this.distro = distro
    this.user_opt = user_opt
    this.theme = theme
    this.verbose = verbose
    this.remix.branding = theme
    this.isClone = isClone

    // branding è solo il basename
    this.remix.branding = path.basename(theme)
  }

  /**
   * config
   */
  async config(release = false) {
    const verbose = true
    const echo = Utils.setEcho(verbose)

    Utils.warning(`creating ${installer().name} configuration files on ${installer().configRoot}`)
    this.createInstallerDirs()
    this.createBranding()
    this.sudoers()

    const codenameLikeId = this.distro.codenameLikeId

    try {

      /**
       * Alpine
       */
      if (codenameLikeId === 'alpine') {
        const alpine = new Alpine(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await alpine.create()


        /**
         * Arch 
         */
      } else if (codenameLikeId === 'rolling') {
        const rolling = new Rolling(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await rolling.create()


        /**
         * Debian
         */
      } else if (codenameLikeId === 'jessie') {
        const jessie = new Jessie(this.installer, this.remix, this.distro, this.user_opt, release, this.verbose)
        await jessie.create()
      } else if (codenameLikeId === 'stretch') {
        const stretch = new Jessie(this.installer, this.remix, this.distro, this.user_opt, release, this.verbose)
        await stretch.create()
      } else if (codenameLikeId === 'buster') {
        const buster = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await buster.create()
      } else if (codenameLikeId === 'bullseye') {
        const bullseye = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await bullseye.create()
      } else if (codenameLikeId === 'bookworm') {
        const bookworm = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await bookworm.create()
      } else if (codenameLikeId === 'trixie') {
        const trixie = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await trixie.create()
      } else if (codenameLikeId === 'forky') {
        const forky = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await forky.create()

        /**
         * Devuan
         */
      } else if (codenameLikeId === 'beowulf') {
        const beowulf = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await beowulf.create()
      } else if (codenameLikeId === 'chimaera') {
        const chimaera = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await chimaera.create()
      } else if (codenameLikeId === 'daedalus') {
        const daedalus = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await daedalus.create()
      } else if (codenameLikeId === 'excalibur') {
        const excalibur = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await excalibur.create()

        /**
         * fedora
         */
      } else if (codenameLikeId === 'fedora') {
        const fedora = new Fedora(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await fedora.create()

        /**
         * openmamba
         */
      } else if (codenameLikeId === 'openmamba') {
        const mamba = new Openmamba(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await mamba.create()

        /**
         * opensuse
         */
      } else if (codenameLikeId === 'opensuse') {
        const suse = new Opensuse(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await suse.create()

        /**
         * Ubuntu
         */
      } else if (codenameLikeId === 'bionic') {
        const bionic = new Bionic(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await bionic.create()
      } else if (codenameLikeId === 'focal') {
        const focal = new Noble(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await focal.create()
      } else if (codenameLikeId === 'jammy') {
        const jammy = new Noble(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await jammy.create()
      } else if (codenameLikeId === 'noble') {
        const noble = new Noble(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await noble.create()
      } else if (codenameLikeId === 'devel') {
        const devel = new Noble(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await devel.create()

      }
    } catch (error) {
      console.error('--- ERRORE FATALE CATTURATO ---');
      console.error('L\'esecuzione si è interrotta durante la creazione della configurazione specifica per la distro.');
      console.error(error)
      process.exit(1)
    }


    if (Pacman.calamaresExists()) {
      await partitionCustomize()
    }

    Utils.warning(`cleanup ${installer().name} configuration files`)
    await this.cleanupConfiguration()
  }


  /**
   * Rewrite modules 
   */
  private async cleanupConfiguration() {
    // modules
    const elements = fs.readdirSync(this.installer.modules)
    elements.sort()
    for (const elem of elements) {
      let file = this.installer.modules + elem
      let fileContent = fs.readFileSync(file, 'utf8')
      let yamlContent = yaml.load(fileContent)
      let destContent = `# ${elem} on ${this.distro.distroId}, penguins-eggs ${pjson.version}\n`
      destContent += '---\n'
      destContent += yaml.dump(yamlContent)
      fs.writeFileSync(file, destContent, 'utf8')
    }

    // settings
    let file = this.installer.configRoot + '/settings.conf'
    let fileContent = fs.readFileSync(file, 'utf8')
    let yamlContent = yaml.load(fileContent)
    let destContent = `# settings.conf on ${this.distro.distroId} penguins-eggs ${pjson.version}\n`
    destContent += '---\n'
    destContent += yaml.dump(yamlContent)
    fs.writeFileSync(file, destContent, 'utf8')
  }


  /**
   *
   */
  private createBranding() {
    const dir = this.installer.configRoot + 'branding/' + this.remix.branding + '/'
    if (!fs.existsSync(dir)) {
      shx.exec(`mkdir ${dir} -p`)
    }

    const file = dir + 'branding.desc'
    let destContent = `# branding.desc on ${this.distro.distroId} penguins-eggs ${pjson.version}\n`
    destContent += '---\n'
    destContent += branding(this.remix, this.distro, this.theme, this.verbose)
    write(file, destContent, this.verbose)
  }

  /**
   *
   */
  private createInstallerDirs() {
    if (this.installer.name !== 'calamares') {
      // Remove krill configuration and multiarc if present
      try {
        shx.exec('rm ' + this.installer.configRoot + ' -rf')
      } catch (error) {
        console.log('error: ' + error + ' removing ' + this.installer.configRoot + ' -rf')
      }

      try {
        shx.exec('rm ' + this.installer.multiarch + ' -rf')
      } catch (error) {
        console.log('error: ' + error + ' removing ' + this.installer.multiarch + ' -rf')
      }
    }

    // rootConfiguration krill/calamares
    if (!fs.existsSync(this.installer.configRoot)) {
      try {
        fs.mkdirSync(this.installer.configRoot)
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.configRoot)
      }
    }

    if (!fs.existsSync(this.installer.configRoot + 'branding')) {
      try {
        fs.mkdirSync(this.installer.configRoot + 'branding')
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.configRoot + 'branding')
      }
    }

    if (!fs.existsSync(this.installer.configRoot + 'branding/eggs')) {
      try {
        fs.mkdirSync(this.installer.configRoot + 'branding/eggs')
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.configRoot + 'branding/eggs')
      }
    }

    if (!fs.existsSync(this.installer.configRoot + 'modules')) {
      try {
        fs.mkdirSync(this.installer.configRoot + 'modules')
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.configRoot + 'modules')
      }
    }

    if (!fs.existsSync(this.installer.multiarch)) {
      try {
        fs.mkdirSync(this.installer.multiarch)
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.multiarch)
      }
    }

    if (!fs.existsSync(this.installer.multiarchModules)) {
      try {
        fs.mkdirSync(this.installer.multiarchModules)
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.multiarchModules)
      }
    }

    /**
     * themes krill/calamares
     */
    let calamaresBranding = path.resolve(__dirname, `../../../addons/eggs/theme/calamares/branding`)
    if (this.theme.includes('/')) {
      calamaresBranding = `${this.theme}/theme/calamares/branding`
    }

    // console.log(`calamaresBranding: ${calamaresBranding}`)
    if (fs.existsSync(calamaresBranding)) {
      if (!fs.existsSync(this.installer.configRoot + `branding/${this.remix.branding}`)) {
        try {
          fs.mkdirSync(this.installer.configRoot + `branding/${this.remix.branding}`)
        } catch (error) {
          console.log('error: ' + error + ' creating ' + this.installer.configRoot + `branding/${this.remix.branding}`)
        }
      }

      // patch quirinux
      shx.cp('-r', calamaresBranding + '/*', this.installer.configRoot + `branding/${this.remix.branding}/`)
    } else {
      console.log(calamaresBranding)
      console.log(`${calamaresBranding} branding not found!`)
      process.exit()
    }

    let calamaresIcon = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/artwork/install-system.png`)
    if (this.theme.includes('/')) {
      calamaresIcon = `${this.theme}/theme/artwork/install-system.png`
    }

    // se non esiste non copio la icona
    if (Pacman.calamaresExists()) {
      if (fs.existsSync(calamaresIcon)) {
        shx.cp(calamaresIcon, '/usr/share/icons/')
      } else {
        console.log(`${calamaresIcon} icon not found!`)
        process.exit()
      }
    }

    let calamaresLauncher = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/applications/install-system.desktop`)
    if (this.theme.includes('/')) {
      calamaresLauncher = `${this.theme}/theme/applications/install-system.desktop`
    }

    if (fs.existsSync(calamaresLauncher)) {
      shx.cp(calamaresLauncher, '/usr/share/applications/')
    } else {
      console.log(`${calamaresLauncher} launcher not found!`)
      process.exit()
    }

    // script di avvio
    shx.cp(path.resolve(__dirname, '../../../assets/calamares/install-system.sh'), '/usr/sbin/install-system.sh')
    shx.chmod('+x', '/usr/sbin/install-system.sh')
  }

  /**
   * soluzione tampone from Glenn
   */
  private sudoers() {
    let live = 'live'
    let content = `${live} ALL=(ALL) NOPASSWD: /usr/bin/calamares`
    content = `# ${live} ALL=(ALL) NOPASSWD: /usr/bin/calamares`
    let fname = '/etc/sudoers.d/calamares'
    // su bionic fa un macello
    if (this.distro.codenameLikeId !== 'bionic') {
      fs.writeFileSync(fname, content, 'utf-8')
    }
  }
}

/**
 *
 * @param file
 * @param content
 * @param verbose
 */
function write(file: string, content: string, verbose = false) {
  if (verbose) {
    console.log(`calamares: create ${file}`)
  }

  fs.writeFileSync(file, content, 'utf8')
}

/**
 *
 */
async function partitionCustomize() {
  const filePartition = '/etc/calamares/modules/partition.conf'
  const partition = yaml.load(fs.readFileSync(filePartition, 'utf8')) as CalamaresPartitionConfig

  // detect filesystem type
  let test = await exec(`df -T / | awk 'NR==2 {print $2}'`, { capture: true, echo: false })
  partition.defaultFileSystemType = test.data.trim()

  /**
   * Determino i filesystem disponibili
   */
  partition.availableFileSystemTypes = ['ext4']

  if (Pacman.packageIsInstalled('btrfs-progs') ||
    Pacman.packageIsInstalled('btrfsprogs')) {
    partition.availableFileSystemTypes.push('btrfs')
  }

  if (Pacman.packageIsInstalled('xfsprogs')) {
    partition.availableFileSystemTypes.push('xfs')
  }

  if (Pacman.packageIsInstalled('f2fs-tools')) {
    partition.availableFileSystemTypes.push('f2fs')
  }

  fs.writeFileSync(filePartition, yaml.dump(partition), 'utf-8')
  
}


