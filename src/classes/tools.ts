/**
 * tools
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import os = require('os')
import fs = require('fs')
import yaml = require('js-yaml')

import Settings from './settings'
import Utils from './utils'
//import { IConfigTools } from '../interfaces'
// import { IConfigTools } from '../interfaces/i-config-tools'

interface IConfigTools {
  remoteHost: string
  remoteUser: string
  remotePathDeb: string
  remotePathDoc: string
  remotePathIso: string
  localPathDeb: string
  localPathDoc: string
  localPathIso: string
  filterDeb: string
}

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
  */
export default class Tools {
  tools_yaml = '/etc/penguins-eggs.d/tools.yaml'

  snapshot_dir = ''

  snapshot_name = ''

  config = {} as IConfigTools

  /*
  * Load configuration from /etc/penguins-eggs.yaml
  * @returns {boolean} Success
  */
  async loadSettings(): Promise<boolean> {
    let foundSettings = false

    if (fs.existsSync(this.tools_yaml)) {
      foundSettings = true
      const loaded = yaml.load(fs.readFileSync(this.tools_yaml, 'utf-8')) as IConfigTools
      this.config.remoteHost = loaded.remoteHost
      this.config.remoteUser = loaded.remoteUser
      this.config.remotePathDeb = loaded.remotePathDeb
      this.config.remotePathDoc = loaded.remotePathDoc
      this.config.remotePathIso = loaded.remotePathIso

      this.config.localPathDeb = loaded.localPathDeb
      this.config.localPathDoc = loaded.localPathDoc
      this.config.localPathIso = loaded.localPathIso

      this.config.filterDeb = loaded.filterDeb

      /**
       * da eggs
       */
      const settings = new Settings()
      settings.load()
      this.snapshot_dir = settings.config.snapshot_dir
      this.snapshot_name = settings.config.snapshot_prefix + settings.config.snapshot_basename + '-' + Utils.debianArch() + '_'
    } else {
      console.log(`Can't find: ${this.tools_yaml}`)
      process.exit(1)
    }
    return foundSettings
  }
}


