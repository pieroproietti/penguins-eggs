import {exec} from '../lib/utils'
import fs from 'fs'
import Distro from './distro'

export default class Locales {
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
        enabledLocales.push(line.replace(/"/g, '').replace(/'/g, '').trim())
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
      supporteds = fs.readFileSync('/usr/share/i18n/SUPPORTED', 'utf-8').split('\n')
    } else if (distro.familyId === 'archlinux') {
      supporteds = (await exec('localectl list-locales', {capture: true, echo: false, ignore: false})).data.split('\n')
    }

    const elements: string[] = []
    for (const elem of supporteds) {
      elements.push(elem.replace(' UTF-8', ''))
    }

    return elements
  }

  /**
     *
     */
  async getDefault(): Promise<string> {
    const file = '/etc/default/locale'
    const cmd = `grep LANG < ${file}|cut -f2 -d=`
    let defaultLanguage = ''
    if (fs.existsSync(file)) {
      const result = await exec(cmd, {capture: true, echo: false, ignore: false})
      if (result.code === 0) {
        defaultLanguage = result.data.replace(/"/g, '').replace(/'/g, '').trim()
      }
    }

    return defaultLanguage
  }
}

