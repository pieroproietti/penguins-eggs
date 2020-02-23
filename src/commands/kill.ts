/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command } from '@oclif/command'

import fs = require('fs')
import ini = require('ini')
import shx = require('shelljs')
import Utils from '../classes/utils'
import Ovary from '../classes/ovary'
import { utils } from 'mocha'


export default class Kill extends Command {
  config_file = '/etc/penguins-eggs.conf' as string
  snapshot_dir = '' as string
  work_dir = ''

  static description = 'kill the eggs/free the nest'

  static aliases = ['clean']

  static examples = [
    `$ eggs kill
kill the eggs/free the nest
`,
  ]

  async run() {
    Utils.titles()
    
    if (Utils.isRoot() && Utils.prerequisitesInstalled()) {
      const ovary = new Ovary
      ovary.cleanUp()
      this.log(`${Utils.getFriendName()}: deleting old eggs...`)
      if (this.loadSettings()){
        shx.exec(`rm ${this.work_dir} -rf`)
        shx.exec(`rm ${this.snapshot_dir} -rf`)
      }
      
    }
  }

  /*
  * Load configuration from /etc/penguins-eggs.conf
  * @returns {boolean} Success
  */
  async loadSettings(): Promise<boolean> {
    let foundSettings: boolean

    const settings = ini.parse(fs.readFileSync(this.config_file, 'utf-8'))

    if (settings.General.snapshot_dir === '') {
      foundSettings = false
    } else {
      foundSettings = true
    }

    this.snapshot_dir = settings.General.snapshot_dir.trim()
    this.work_dir = settings.General.work_dir.trim()
  
    if (!this.snapshot_dir.endsWith('/')) {
      this.snapshot_dir += '/'
    }
    return foundSettings
  }
}

