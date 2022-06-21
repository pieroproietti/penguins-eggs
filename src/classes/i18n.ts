/**
 * penguins-eggs: 
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

// packages
import fs from 'fs'
import mustache from 'mustache'
import Settings from './settings'
import Utils from './utils'

// libraries
import { exec } from '../lib/utils'
import Distro from './distro'
import shx from 'shelljs'

/**
 * I18n
 */
export default class I18n {
  verbose = false

  echo = {}

  toNull = ''

  chroot = '/'

  settings = {} as Settings

  constructor(chroot = '/', verbose = false) {
    this.verbose = verbose
    this.echo = Utils.setEcho(verbose)
    if (this.verbose) {
      this.toNull = ' > /dev/null 2>&1'
    }
    this.settings = new Settings()
    this.chroot = chroot
  }

  /**
   * 
   */
  async generate(defaultLocale = 'en_EN.UTF-8', locales = ['en_EN.UTF-8']) {
    console.log(locales)
    await this.etcLocaleGen(locales)
    await this.etcLocaleConf(defaultLocale)
    await this.etcDefaultLocale(defaultLocale)
    await exec(`chroot ${this.chroot} /usr/sbin/locale-gen`, this.echo)
  }

  /**
   * etcLocaleGen
   */
  private async etcLocaleGen(locales: string[]) {
    const distro = new Distro()
    let supporteds: string[] = []
    if (distro.familyId === 'debian') {
      supporteds = fs.readFileSync('/usr/share/i18n/SUPPORTED', 'utf-8').split('\n')
    } else if (distro.familyId === 'archlinux') {
      // with await exec don't work! 
      shx.exec('localectl list-locales > /tmp/SUPPORTED')
      supporteds = fs.readFileSync('/tmp/SUPPORTED', 'utf-8').split('\n')
    }


    let lgt = ''
    lgt += '###\n'
    lgt += '#\n'
    lgt += '# Locales enabled by Krill\n'
    for (const supported of supporteds) {
      for (const locale of locales) {
        if (supported.includes(locale)) {
          lgt += `${locale}\n`
        }
      }
    }
    lgt += '###\n'
    lgt += '#\n'
    lgt += '# Locales enabled by Krill\n'

    // append to `${this.chroot}/etc/locale.gen`
    const destGen = `${this.chroot}/etc/locale.gen`
    fs.appendFileSync(destGen, lgt)
  }


  /**
   * /etc/locale.conf
   */
  private async etcLocaleConf(defaultLocale: string) {

    let lct = ''
    lct += 'LANG={{{locale}}}\n'
    lct += 'LC_ADDRESS={{{locale}}}\n'
    lct += 'LC_IDENTIFICATION={{{locale}}}\n'
    lct += 'LC_MEASUREMENT={{{locale}}}\n'
    lct += 'LC_MONETARY={{{locale}}}\n'
    lct += 'LC_NAME={{{locale}}}\n'
    lct += 'LC_NUMERIC={{{locale}}}\n'
    lct += 'LC_PAPER={{{locale}}}\n'
    lct += 'LC_TELEPHONE={{{locale}}}\n'
    lct += 'LC_TIME={{{locale}}}\n'
    const destConf = `${this.chroot}/etc/locale.conf`
    const view = {
      locale: defaultLocale
    }
    // console.log(mustache.render(lct, view))
    fs.writeFileSync(destConf, mustache.render(lct, view))
  }

  /**
  * /etc/default/locale
  */
  private async etcDefaultLocale(defaultLocale: string) {
    let lct = ''
    lct += 'LANG={{{locale}}}\n'
    lct += 'LC_ADDRESS={{{locale}}}\n'
    lct += 'LC_IDENTIFICATION={{{locale}}}\n'
    lct += 'LC_MEASUREMENT={{{locale}}}\n'
    lct += 'LC_MONETARY={{{locale}}}\n'
    lct += 'LC_NAME={{{locale}}}\n'
    lct += 'LC_NUMERIC={{{locale}}}\n'
    lct += 'LC_PAPER={{{locale}}}\n'
    lct += 'LC_TELEPHONE={{{locale}}}\n'
    lct += 'LC_TIME={{{locale}}}\n'
    const destConf = `${this.chroot}/etc/default/locale`
    const view = {
      locale: defaultLocale
    }
    fs.writeFileSync(destConf, mustache.render(lct, view))
  }
}

