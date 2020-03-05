/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'

import fs = require('fs')
import ini = require('ini')
import shx = require('shelljs')
import Utils from '../classes/utils'
import Ovary from '../classes/ovary'
import { IWorkDir } from '../interfaces/i-workdir'

const exec = require('../lib/utils').exec


export default class Kill extends Command {
  config_file = '/etc/penguins-eggs.conf' as string
  snapshot_dir = '' as string
  work_dir = {} as IWorkDir

  static description = 'kill the eggs/free the nest'

  static flags = {
    help: flags.help({ char: 'h' }),
  }

  static aliases = ['clean']

  static examples = [
    `$ eggs kill
kill the eggs/free the nest
`,
  ]

  async run() {
    Utils.titles()
    const { args, flags } = this.parse(Kill)


    if (Utils.isRoot() && Utils.prerequisitesInstalled()) {
      const ovary = new Ovary
      await ovary.fertilization()
      await ovary.uBindLiveFs()
      this.log(`${Utils.getFriendName()}: deleting old eggs ...`)
      if (this.loadSettings()) {
        await exec(`rm ${this.work_dir.path} -rf`)
        await exec(`rm ${this.snapshot_dir} -rf`)
      } else {
        await exec(`rm /home/eggs -rf`)
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
      if (settings.General.snapshot_dir !== undefined) {
        this.snapshot_dir = settings.General.snapshot_dir.trim()
        if (!this.snapshot_dir.endsWith('/')) {
          this.snapshot_dir += '/'
        }
        this.work_dir.path = this.snapshot_dir + 'work/'
      }
    }
    return foundSettings
  }
}

