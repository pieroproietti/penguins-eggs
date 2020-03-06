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
import { files } from 'pjson'


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
  public async configure(verbose = false) {
    if (await Utils.packageIsInstalled('calamares')) {
      if (verbose){
        console.log(`calamares: [${this.oses.distroId}/${this.oses.versionId}]->[${this.oses.distroLike}/${this.oses.versionLike}]`)
      }
      await this.configuration(verbose)
      await this.settingsConf(verbose)
      await this.brandingDesc(verbose)
      await this.sourcesMedia(verbose)
      await this.sourcesFinal(verbose)
      await this.bootLoaderConfig(verbose)
      await this.unpackfsConf(verbose)
      await this.packages(verbose)
      await this.removeuser(verbose)
      await this.displaymanager(verbose)
    }
  }

  /**
   * branding
   */
  async configuration(verbose = false) {
    if (verbose){
      console.log('calamares: configuration')
    }
    const versionLike = this.oses.versionLike

    // Copia i template
    shx.cp(`-r`, path.resolve(__dirname,`../../templates/distros/${versionLike}/calamares`), `/etc/`)
    // Copia branding: uguale per tutti
    shx.cp(`-r`, path.resolve(__dirname,`../../templates/branding`), `/etc/calamares`)
  }

  /**
   * settingsConf
   */
  async settingsConf(verbose = false) {
    const versionLike = this.oses.versionLike
    const confPath = '/etc/calamares/settings.conf'
    if (verbose) {
      console.log(`calamares: create module ${confPath}`)
    }
    let settings = {}
    let sourcesFinal = ''

    if (versionLike === 'buster') {
      settings = Buster.settings()
    } else if (versionLike === 'bionic') {
      settings = Bionic.settings()
    } else if (versionLike === 'eoan') {
      settings = Eoan.settings()
    }
    fs.writeFileSync(confPath, `# distroType: ${versionLike}\n` + yaml.safeDump(settings), 'utf8')
  }

  /**
   * create script /usr/sbin/sources-media
   */
  async sourcesMedia(verbose = false) {
    this.sourcesMediaDesc(verbose) 
    this.sourcesMediaScript(verbose)
  }

  /**
   * create module sources-media
   */
  private async sourcesMediaDesc(verbose = false){
    const confPath = '/usr/lib/calamares/modules/sources-media'
    if (verbose) {
      console.log(`calamares: create module ${confPath}`)
    }
    const descFile = 'module.desc'
    let text = ''
    text +='---\n'
    text +='type:       "job"\n'
    text +='name:       "sources-media"\n'
    text +='interface:  "process"\n'
    text +='command:    "/usr/sbin/sources-media"\n'
    text +='timeout:    600\n'
    if (!fs.existsSync(confPath)){
      fs.mkdirSync(confPath)
    }
    fs.writeFileSync(`${confPath}/${descFile}`, text, 'utf8')
  }

  /**
   * create script per sources-media
   */
  private sourcesMediaScript(verbose = false){
    const versionLike = this.oses.versionLike
    const scriptPath = '/usr/sbin/sources-media'
    if (verbose) {
      console.log(`calamares: create script ${scriptPath} type ${versionLike}`)
    }
    let content = ''
    if (versionLike === 'buster') {
      content = Buster.sourcesMedia()
    } else if (versionLike === 'bionic') {
      // content = Bionic.sourcesMedia()
    } else if (versionLike === 'eoan') {
      //content = Eoan.sourcesMedia()
    }
    fs.writeFileSync(scriptPath, content, 'utf8')
    shx.chmod('+x', scriptPath)
  }

  
  /**
   * create script /usr/blin/sources-final
   */
  async sourcesFinal(verbose = false) {
    const versionLike = this.oses.versionLike
    const scriptPath = '/usr/sbin/sources-final'
    if (verbose) {
      console.log(`calamares: create script ${scriptPath} type ${versionLike}`)
    }
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
   * create branding.desc
   */
  async brandingDesc(verbose = false) {
    const brandingPath =`/etc/calamares/branding/${this.distro.branding}`
    const descPath = `${brandingPath}/branding.desc`
    if (verbose) {
      console.log(`calamares: create desc ${descPath}`)
    }
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
    fs.writeFileSync(descPath, `#versionLike: ${versionLike}\n` + yaml.safeDump(branding), 'utf8')
  }

  /**
   * create module unpackfs.conf
   */
  unpackfsConf(verbose = false) {
    const confPath = '/etc/calamares/modules/unpackfs.conf'
    if (verbose) {
      console.log(`calamares: create module ${confPath}`)
    }
    let text = '---\n'
    text += 'unpack:\n'
    text += `-   source: "${this.oses.mountpointSquashFs}"\n`
    text += '    sourcefs: "squashfs"\n'
    text += '    unpack:\n'
    text += '    destination: ""\n'
    fs.writeFileSync(confPath, text, 'utf8')
  }

  /**
   * create script /sbin/bootloades-config
   * Add /tmp in chroot /tmp/calamares
   */
  bootLoaderConfig(verbose = false){
    const scriptPath = '/sbin/bootloader-config'
    if (verbose) {
      console.log(`calamares: create script ${scriptPath}`)
    }
    const content = Generic.bootLoaderConfig()
    fs.writeFileSync(scriptPath, content, 'utf8')
    shx.chmod('+x', scriptPath)
  }

  /**
   * create module packages.conf
   */
  packages(verbose = false) {
    const confPath = '/etc/calamares/modules/packages.conf'
    if (verbose) {
      console.log(`calamares: create module ${confPath}`)
    }
    const content = Generic.packages()
    fs.writeFileSync(confPath, content, 'utf8')
  }

  /**
   * create module removeusers.conf
   */
  removeuser(verbose = false) {
    const confPath = '/etc/calamares/modules/removeuser.conf'
    if (verbose) {
      console.log(`calamares: create module ${confPath}`)
    }
    const content = Generic.removeuser()
    fs.writeFileSync(confPath, content, 'utf8')
  }

  /** 
   * create module displaymanager.conf
   */
  displaymanager(verbose = false) {
    const confPath = '/etc/calamares/modules/displaymanager.conf'
    if (verbose) {
      console.log(`calamares: create module ${confPath}`)
    }
    const content = Generic.displaymanager()
    fs.writeFileSync(confPath, content, 'utf8')
  }
}

export default Calamares
