/**
 * penguins-eggs: incubator.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import fs from 'node:fs'
import path from 'node:path'
import shx from 'shelljs'
import Utils from '../utils.js'
import {IRemix, IDistro} from '../../interfaces/index.js'

import {Jessie} from './distros/jessie.js'
import {Buster} from './distros/buster.js'
import {Focal} from './distros/focal.js'
import {Bionic} from './distros/bionic.js'
import {Rolling} from './distros/rolling.js'

import Pacman from '../pacman.js'
import {installer} from './installer.js'
import {IInstaller} from '../../interfaces/i-installer.js'

import {exec} from '../../lib/utils.js'


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

  /**
   *
   * @param remix
   * @param distro
   * @param verbose
   */
  constructor(remix: IRemix, distro: IDistro, user_opt = 'live', theme = 'eggs', verbose = false) {
    this.installer = installer()
    this.remix = remix
    this.distro = distro
    this.user_opt = user_opt
    this.theme = theme
    this.verbose = verbose
    this.remix.branding = theme
    if (theme.includes('/')) {
      this.remix.branding = theme.slice(Math.max(0, theme.lastIndexOf('/') + 1))
    }
  }

  /**
   * config
   */
  async config(release = false) {
    const verbose = true
    const echo = Utils.setEcho(verbose)

    this.createInstallerDirs()

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
      const buster = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.verbose)
      await buster.create()

      break
    }

    case 'bullseye': {
      const bullseye = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.verbose)
      await bullseye.create()

      break
    }

    case 'bookworm': {
      const bookworm = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.verbose)
      await bookworm.create()
      // DEVUAN

      break
    }

    /**
       * DEVUAN
       */
    case 'beowulf': {
      const beowulf = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.verbose)
      await beowulf.create()

      break
    }

    case 'chimaera': {
      const chimaera = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.verbose)
      await chimaera.create()

      break
    }

    case 'daedalus': {
      const daedalus = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.verbose)
      await daedalus.create()

      break
    }

    /**
       * UBUNTU
       */
    case 'bionic': {
      const bionic = new Bionic(this.installer, this.remix, this.distro, this.user_opt, release, this.verbose)
      await bionic.create()

      break
    }

    case 'focal': {
      const focal = new Focal(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.verbose)
      await focal.create()

      break
    }

    case 'jammy': {
      const jammy = new Focal(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.verbose)
      await jammy.create()

      break
    }

    case 'kinetic': {
      const kinetic = new Focal(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.verbose)
      await kinetic.create()

      break
    }

    /**
       * Arch
       */
    case 'rolling': {
      const rolling = new Rolling(this.installer, this.remix, this.distro, this.user_opt, release, this.verbose)
      await rolling.create()

      break
    }

      // No default
    }

    this.createBranding()
  }

  /**
   *
   */
  private createInstallerDirs() {
    if (this.installer.name !== 'calamares') {
      // Remove krill configuration and multiarc if present
      try {
        shx.exec('rm ' + this.installer.configuration + ' -rf')
      } catch (error) {
        console.log('error: ' + error + ' removing ' + this.installer.configuration + ' -rf')
      }

      try {
        shx.exec('rm ' + this.installer.multiarch + ' -rf')
      } catch (error) {
        console.log('error: ' + error + ' removing ' + this.installer.multiarch + ' -rf')
      }
    }

    // rootConfiguration krill calamares
    if (!fs.existsSync(this.installer.configuration)) {
      try {
        fs.mkdirSync(this.installer.configuration)
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.configuration)
      }
    }

    if (!fs.existsSync(this.installer.configuration + 'branding')) {
      try {
        fs.mkdirSync(this.installer.configuration + 'branding')
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.configuration + 'branding')
      }
    }

    if (!fs.existsSync(this.installer.configuration + 'branding/eggs')) {
      try {
        fs.mkdirSync(this.installer.configuration + 'branding/eggs')
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.configuration + 'branding/eggs')
      }
    }

    if (!fs.existsSync(this.installer.configuration + 'modules')) {
      try {
        fs.mkdirSync(this.installer.configuration + 'modules')
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.configuration + 'modules')
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
     * ADDONS (only for calamares)
     */
    if (this.installer.name === 'calamares') {
      // console.log('theme: ' + this.theme)
      let calamaresBranding = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/calamares/branding`)
      if (this.theme.includes('/')) {
        calamaresBranding = `${this.theme}/theme/calamares/branding`
      }

      if (fs.existsSync(calamaresBranding)) {
        if (!fs.existsSync(this.installer.configuration + `branding/${this.remix.branding}`)) {
          try {
            fs.mkdirSync(this.installer.configuration + `branding/${this.remix.branding}`)
          } catch (error) {
            console.log('error: ' + error + ' creating ' + this.installer.configuration + `branding/${this.remix.branding}`)
          }
        }

        shx.cp(calamaresBranding + '/*', this.installer.configuration + `branding/${this.remix.branding}/`)
      } else {
        console.log(`${calamaresBranding} branding not found!`)
        process.exit()
      }

      let calamaresIcon = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/artwork/install-debian.png`)
      if (this.theme.includes('/')) {
        calamaresIcon = `${this.theme}/theme/artwork/install-debian.png`
      }

      if (fs.existsSync(calamaresIcon)) {
        shx.cp(calamaresIcon, '/usr/share/icons/')
      } else {
        console.log(`${calamaresIcon} icon not found!`)
        process.exit()
      }

      let calamaresLauncher = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/applications/install-debian.desktop`)
      if (this.theme.includes('/')) {
        calamaresLauncher = `${this.theme}/theme/applications/install-debian.desktop`
      }

      if (fs.existsSync(calamaresLauncher)) {
        shx.cp(calamaresLauncher, '/usr/share/applications/')
      } else {
        console.log(`${calamaresLauncher} launcher not found!`)
        process.exit()
      }

      // script di avvio
      shx.cp(path.resolve(__dirname, '../../../assets/calamares/install-debian'), '/usr/sbin/install-debian')
      shx.chmod('+x', '/usr/sbin/install-debian')
    }
  }

  /**
   *
   */
  private createBranding() {
    const branding = require('./branding').branding
    const dir = this.installer.configuration + 'branding/' + this.remix.branding + '/'
    if (!fs.existsSync(dir)) {
      shx.exec(dir + ' -p')
    }

    const file = dir + 'branding.desc'
    const content = branding(this.remix, this.distro, this.verbose)
    write(file, content, this.verbose)
  }

  /**
   * non dovrebbe servire
   */
  private async createInstallDebian() {
    const scriptInstallDebian = require('./calamares-modules/scripts/install-debian').installDebian
    const scriptDir = '/usr/bin/'
    const scriptFile = scriptDir + 'install-debian'
    const scriptContent = scriptInstallDebian()
    write(scriptFile, scriptContent, this.verbose)
    await exec(`chmod +x ${scriptFile}`)
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
