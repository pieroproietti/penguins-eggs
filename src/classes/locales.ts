 /**
 * ./src/classes/locales.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

 import fs from 'node:fs'

import {exec} from '../lib/utils.js'
import Distro from './distro.js'

export default class Locales {
  /**
     *
     */
  async getDefault(): Promise<string> {
    const file = '/etc/default/locale'
    const cmd = `grep LANG < ${file}|cut -f2 -d=`
    let defaultLanguage = 'en_US.UTF-8'
    if (fs.existsSync(file)) {
      const result = await exec(cmd, {capture: true, echo: false, ignore: false})
      if (result.code === 0) {
        defaultLanguage = result.data.replaceAll('"', '').replaceAll('\'', '').trim()
      }
    }

    return defaultLanguage
  }

  /**
     *
     */
  async getEnabled(): Promise<string[]> {
    // Restituisce i locales abilitati in Debian, per manjaro quelli presenti
    // in /etc/locale.gen anche se #disabilitati
    const cmd = 'localectl list-locales'
    const enabledLocales: string[] = []
    const result = await exec(cmd, {capture: true, echo: false, ignore: false})
    if (result.code === 0) {
      const lines = result.data.split('\n')
      for (const line of lines) {
        enabledLocales.push(line.replaceAll('"', '').replaceAll('\'', '').trim())
      }
    }

    return enabledLocales
  }

  /**
     *
     */
  async getSupported(): Promise<string[]> {
    const distro = new Distro()
    let supporteds: string[] = []
    if (distro.familyId === 'debian') {
      supporteds = fs.readFileSync('/usr/share/i18n/SUPPORTED', 'utf8').split('\n')
    } else if (distro.familyId === 'archlinux') {
      supporteds = (await exec('localectl list-locales', {capture: true, echo: false, ignore: false})).data.split('\n')
    }

    const elements: string[] = []
    for (const elem of supporteds) {
      elements.push(elem.replace(' UTF-8', ''))
    }

    return elements
  }
}

