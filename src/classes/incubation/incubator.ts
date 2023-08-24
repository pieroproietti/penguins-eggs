/**
 * penguins-eggs: incubator.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import fs from 'node:fs'
import path from 'node:path'
import shx from 'shelljs'
import Utils from '../utils'
import { IRemix, IDistro } from '../../interfaces/index'

import { Jessie } from './distros/jessie'
import { Buster } from './distros/buster'
import { Focal } from './distros/focal'
import { Bionic } from './distros/bionic'
import { Rolling } from './distros/rolling'

import Pacman from '../pacman'
import { installer } from './installer'
import { IInstaller } from '../../interfaces/i-installer'

// partition
import yaml from 'js-yaml'
import { ICalamaresPartition } from '../../interfaces/i-calamares-partition'


/**
 *
 */
export default class Incubator {
  verbose = false

  installer = {} as IInstaller

  remix: IRemix

  distro: IDistro

  user_opt: string

  theme: string

  isClone: boolean

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
    partitionCustomize()
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
   *
   */
  private createBranding() {
    const branding = require('./branding').branding

    const dir = this.installer.configRoot + 'branding/' + this.remix.branding + '/'
    if (!fs.existsSync(dir)) {
      shx.exec(`mkdir ${dir} -p`)
    }

    const file = dir + 'branding.desc'
    const content = branding(this.remix, this.distro, this.verbose)
    write(file, content, this.verbose)
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
  let partition = yaml.load(fs.readFileSync(filePartition, 'utf-8')) as ICalamaresPartition
  partition.defaultFileSystemType = 'ext4'
  partition.availableFileSystemTypes = ['ext4']
  if (Pacman.packageIsInstalled('btrfs-progs')) {
    partition.defaultFileSystemType = 'btrfs'
    partition.availableFileSystemTypes = ['btrfs', 'ext4']
  }
  fs.writeFileSync(filePartition, yaml.dump(partition), 'utf-8')

}