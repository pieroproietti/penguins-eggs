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
   * new change[1] - Added try-catch for error handling in getDefault method
   * This ensures that if there is an issue executing the command, we can catch the error and handle it gracefully.
   */
  async getDefault(): Promise<string> {
    const cmd = `locale|grep LANG|cut -f2 -d=`
    let defaultLanguage = 'en_US.UTF-8'
    try {
      const result = await exec(cmd, { capture: true, echo: false, ignore: false })
      if (result.code === 0) {
        defaultLanguage = result.data.trim()
      }
    } catch (error) {
      console.error("Error getting default language:", error)
    }
    return defaultLanguage
  }

  /**
   * new change[2] - Added error handling in getSupported method
   * Now errors in exec or file reading will be properly handled.
   */
  async getSupported(): Promise<string[]> {
    const distro = new Distro()
    let supporteds: string[] = []
    try {
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
        default:
          console.warn("Unsupported distro:", distro.familyId)
          break
      }

      const elements: string[] = []
      for (const elem of supporteds) {
        elements.push(elem.replace(' UTF-8', ''))
      }
      return elements
    } catch (error) {
      console.error("Error getting supported locales:", error)
      return []
    }
  }

  /**
   * new change[3] - Added try-catch block in getEnabled method to handle potential errors
   * This ensures that any failure in executing commands is handled appropriately.
   */
  async getEnabled(): Promise<string[]> {
    let cmd = "locale -a"
    if (Utils.isSystemd()) {
      cmd = "localectl list-locales"
    }

    const enabledLocales: string[] = []
    try {
      const result = await exec(cmd, { capture: true, echo: false, ignore: false })
      if (result.code === 0) {
        const lines = result.data.split('\n')
        for (const line of lines) {
          enabledLocales.push(line.trim())
        }
      }
    } catch (error) {
      console.error("Error getting enabled locales:", error)
    }
    return enabledLocales
  }

  /**
   * new change[4] - Used more dynamic method to handle unsupported distros gracefully
   * We provide a default warning message in case of unsupported distributions.
   */
  async getSupported(): Promise<string[]> {
    const distro = new Distro()
    let supporteds: string[] = []
    switch (distro.familyId) {
      case 'debian':
        try {
          supporteds = fs.readFileSync('/usr/share/i18n/SUPPORTED', 'utf8').split('\n')
        } catch (err) {
          console.error("Failed to read supported locales on Debian:", err)
        }
        break
      default:
        console.warn(`Distro ${distro.familyId} not supported for getting supported locales`)
        supporteds = await this.getEnabled()
    }

    const elements: string[] = []
    for (const elem of supporteds) {
      elements.push(elem.replace(' UTF-8', ''))
    }
    return elements
  }
}
