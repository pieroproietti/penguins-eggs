/* eslint-disable no-console */
/**
 * penguins-eggs: Calamares.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import yaml = require('js-yaml')
import fs = require('fs')
import path = require('path')
import shx = require('shelljs')
import { IDistro, IOses } from '../interfaces'
import Utils from './utils'

// Distribuzioni
import Generic from './distros/generic'
// Debian
import Buster from './distros/buster'
// Ubuntu
import Bionic from './distros/bionic'
import Eoan from './distros/eoan'


class Calamares {
  distro: IDistro

  oses: IOses

  constructor(distro: IDistro, oses: IOses) {
    this.distro = distro
    this.oses = oses
  }

  /**
   * configure calamares-settings-eggs
   */
  public async configure() {
    if (await Utils.packageIsInstalled('calamares')) {
      console.log('==========================================')
      console.log(`calamares: [${this.oses.distroId}/${this.oses.versionId}]->[${this.oses.distroLike}/${this.oses.versionLike}]`)
      console.log('==========================================')
      await this.configuration()
      await this.settingsConf()
      await this.brandingDesc()
      await this.sourcesFinal()
      await this.bootLoaderConfig()
      await this.unpackfsConf()
      await this.packages()
    }
  }

  /**
   * branding
   */
  async configuration() {
    const versionLike = this.oses.versionLike
    console.log('==========================================')
    console.log('calamares: configuration')
    console.log('==========================================')

    // Copia i template
    shx.cp(`-r`, path.resolve(__dirname,`../../templates/distros/${versionLike}/calamares`), `/etc/`)
    // Copia branding: uguale per tutti
    shx.cp(`-r`, path.resolve(__dirname,`../../templates/branding`), `/etc/calamares`)
  }

  /**
   * settingsConf
   */
  async settingsConf() {
    const versionLike = this.oses.versionLike
    console.log('==========================================')
    console.log('calamares: settingsConf')
    console.log('==========================================')

    const settingsPath = '/etc/calamares/settings.conf'
    let settings = {}
    let sourcesFinal = ''

    if (versionLike === 'buster') {
      settings = Buster.settings()
    } else if (versionLike === 'bionic') {
      settings = Bionic.settings()
    } else if (versionLike === 'eoan') {
      settings = Eoan.settings()
    }
    fs.writeFileSync(settingsPath, `# distroType: ${versionLike}\n` + yaml.safeDump(settings), 'utf8')
  }

  /**
   * 
   */
  async sourcesFinal() {
    const versionLike = this.oses.versionLike
    console.log('==========================================')
    console.log('calamares: sourceFinal')
    console.log('==========================================')
    const scriptPath = '/usr/sbin/sources-final'
    let content = ''

    if (versionLike === 'buster') {
      content = Buster.sourcesFinal()
    } else if (versionLike === 'bionic') {
      content = Bionic.sourcesFinal()
    } else if (versionLike === 'eoan') {
      content = Eoan.sourcesFinal()
    }
    fs.writeFileSync(scriptPath, content, 'utf8')
    shx.chmod('+x', scriptPath)
  }



  /**
   * brandingDesc
   */
  async brandingDesc() {
    console.log('==========================================')
    console.log('calamares: brandingDesc')
    console.log('==========================================')

    // Configurazione branding.desc
    const brandingPath = `/etc/calamares/branding/${this.distro.branding}`
    const brandingFile = `${brandingPath}/branding.desc`
    const versionLike: string = this.oses.versionLike
    const homeUrl: string = this.oses.homeUrl
    const supportUrl: string = this.oses.supportUrl
    const bugReportUrl: string = this.oses.bugReportUrl

    const productName = this.distro.name
    const shortProductName = this.distro.name
    const version = this.distro.versionNumber + ' ( ' + this.distro.versionName + ')'
    const shortVersion = this.distro.versionNumber
    const versionedName = this.distro.name
    const shortVersionedName = this.distro.versionName
    const bootloaderEntryName = productName
    const productUrl = homeUrl
    const releaseNotesUrl = 'https://github.com/pieroproietti/penguins-eggs'
    const productLogo = `${this.distro.branding}-logo.png`
    const productIcon = `${this.distro.branding}-logo.png`
    const productWelcome = 'welcome.png'
    const slideshow = 'show.qml'

    if (!fs.existsSync(brandingPath)) {
      fs.mkdirSync(brandingPath)
    }

    const branding =
    {
      componentName: this.distro.branding,
      welcomeStyleCalamares: true,
      strings:
      {
        productName: productName,
        shortProductName: shortProductName,
        version: version,
        shortVersion: shortVersion,
        versionedName: versionedName,
        shortVersionedName: shortVersionedName,
        bootloaderEntryName: bootloaderEntryName,
        productUrl: productUrl,
        supportUrl: supportUrl,
        releaseNotesUrl: releaseNotesUrl,
      },
      images:
      {
        productLogo: productLogo,
        productIcon: productIcon,
        productWelcome: productWelcome,
      },
      slideshow: slideshow,
      style:
      {
        sidebarBackground: '#2c3133',
        sidebarText: '#FFFFFF',
        sidebarTextSelect: '#4d7079',
      },
    }
    fs.writeFileSync(brandingFile, `#versionLike: ${versionLike}\n` + yaml.safeDump(branding), 'utf8')
  }

  /**
   * unpackfsConf
   */
  unpackfsConf() {
    const file = '/etc/calamares/modules/unpackfs.conf'
    let text = '---\n'
    text += 'unpack:\n'
    text += `-   source: "${this.oses.mountpointSquashFs}"\n`
    text += '    sourcefs: "squashfs"\n'
    text += '    unpack:\n'
    text += '    destination: ""\n'
    fs.writeFileSync(file, text, 'utf8')
  }

  /**
   * bootLoaderConfig
   * Crea la /tmp mancante in /tmp/calamares
   */
  bootLoaderConfig(){
    const scriptPath = '/sbin/bootloader-config'
    const content = Generic.bootLoaderConfig()
    fs.writeFileSync(scriptPath, content, 'utf8')
    shx.chmod('+x', scriptPath)
  }

  /**
   * 
   */
  packages() {
    const confPath = '/etc/calamares/modules/packages.conf'
    const content = Generic.packages()
    fs.writeFileSync(confPath, content, 'utf8')
  }
}

export default Calamares
