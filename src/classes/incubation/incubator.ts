/**
 * ./src/classes/incubation/incubator.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// partition
import yaml from 'js-yaml'
import fs from 'node:fs'
import path from 'node:path'
import shx from 'shelljs'

import { ICalamaresPartition } from '../../interfaces/i-calamares-partition.js'
import { IInstaller } from '../../interfaces/i-installer.js'
import { IDistro, IRemix } from '../../interfaces/index.js'
import Pacman from '../pacman.js'
import Utils from '../utils.js'
import { Bionic } from './distros/bionic.js'
import { Buster } from './distros/buster.js'
import { Focal } from './distros/focal.js'
import { Jessie } from './distros/jessie.js'
import { Rolling } from './distros/rolling.js'
import { installer } from './installer.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

// const branding = require('./branding.js').branding
import { branding } from './branding.js'

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

    this.createInstallerDirs()
    this.createBranding()

    // DEBIAN
    switch (this.distro.codenameLikeId) {
      case 'jessie': {
        const jessie = new Jessie(this.installer, this.remix, this.distro, this.user_opt, release, this.verbose)
        await jessie.create()

        break
      }

      case 'stretch': {
        const stretch = new Jessie(this.installer, this.remix, this.distro, this.user_opt, release, this.verbose)
        await stretch.create()

        break
      }

      case 'buster': {
        const buster = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await buster.create()

        break
      }

      case 'bullseye': {
        const bullseye = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await bullseye.create()

        break
      }

      case 'bookworm': {
        const bookworm = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await bookworm.create()

        break
      }

      case 'trixie': {
        const trixie = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await trixie.create()
        // DEVUAN

        break
      }

      /**
       * DEVUAN
       */
      case 'beowulf': {
        const beowulf = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await beowulf.create()

        break
      }

      case 'chimaera': {
        const chimaera = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await chimaera.create()

        break
      }

      case 'daedalus': {
        const daedalus = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await daedalus.create()

        break
      }

      /**
       * UBUNTU
       */
      case 'bionic': {
        const bionic = new Bionic(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await bionic.create()

        break
      }

      case 'focal': {
        const focal = new Focal(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await focal.create()

        break
      }

      case 'jammy': {
        const jammy = new Focal(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await jammy.create()

        break
      }

      case 'devel': {
        const devel = new Focal(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await devel.create()

        break
      }

      /**
       * Arch
       */
      case 'rolling': {
        const rolling = new Rolling(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await rolling.create()

        break
      }
    }

    if (Pacman.calamaresExists()) {
      partitionCustomize()
    }
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
    const content = branding(this.remix, this.distro, this.theme, this.verbose)
    write(file, content, this.verbose)
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
function partitionCustomize() {
  const filePartition = '/etc/calamares/modules/partition.conf'
  const partition = yaml.load(fs.readFileSync(filePartition, 'utf8')) as ICalamaresPartition
  partition.defaultFileSystemType = 'ext4'
  partition.availableFileSystemTypes = ['ext4']
  if (Pacman.packageIsInstalled('btrfs-progs')) {
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
