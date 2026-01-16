/**
 * ./src/classes/locales.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'

import { exec } from '../lib/utils.js'
import Distro from './distro.js'
import Utils from './utils.js'

export default class Locales {
  /**
   *
   */
  async getDefault(): Promise<string> {
    const cmd = `locale|grep LANG|cut -f2 -d=`
    let defaultLanguage = 'en_US.UTF-8'
    const result = await exec(cmd, { capture: true, echo: false, ignore: false })
    if (result.code === 0) {
      defaultLanguage = result.data.trim()
    }
    
    return defaultLanguage
  }

  /**
   * getEnabled
   */
  async getEnabled(): Promise<string[]> {
    let cmd="locale -a"
    if (Utils.isSystemd()) {
      cmd="localectl list-locales"
    }

    const enabledLocales: string[] = []
    const result = await exec(cmd, { capture: true, echo: false, ignore: false })
    if (result.code === 0) {
      const lines = result.data.split('\n')
      for (const line of lines) {
        enabledLocales.push(line.trim())
      }
    }

    return enabledLocales
  }

  /**
   * getSupported
   */
  async getSupported(): Promise<string[]> {
    const distro = new Distro()
    let supporteds: string[] = []
    switch (distro.familyId) {
      case 'alpine': {
        supporteds = await this.getEnabled()
        break
      }

      case 'archlinux': {
        supporteds = await this.getEnabled()
        break
      }

      case 'debian': {
        supporteds = fs.readFileSync('/usr/share/i18n/SUPPORTED', 'utf8').split('\n')
        break
      }

      case 'fedora': {
        supporteds = await this.getEnabled()
        break
      }

      case 'opensuse': {
        supporteds = await this.getEnabled()
        break
      }
    }

    const elements: string[] = []
    for (const elem of supporteds) {
      elements.push(elem.replace(' UTF-8', ''))
    }

    return elements
  }

}
