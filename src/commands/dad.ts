/**
 * penguins-eggs-v8 
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'
import Settings from '../classes/settings'
import Ovary from '../classes/ovary'
import inquirer = require('inquirer')

import { IMyAddons } from '../interfaces'

const exec = require('../lib/utils').exec

interface IConfig {
  snapshot_dir: string
  snapshot_basename: string
  opt_user: string
  opt_user_passwd: string
  root_passwd: string
  theme: string
  make_efi: boolean
  make_md5sum: boolean
  make_isohybrid: boolean
  compression: string
  ssh_pass: boolean
  timezone: string

}

export default class Dad extends Command {

  static description = 'ask for daddy (gui interface)!'

  settings = {} as Settings

  static flags = {
    help: flags.help({ char: 'h' }),
    verbose: flags.boolean({ char: 'v' }),
  }

  static args = [{ name: 'file' }]

  async run() {
    Utils.titles(this.id + ' ' + this.argv)
    const { args, flags } = this.parse(Dad)

    this.daddy(flags.verbose)
  }

  /**
   * 
   */
  async daddy(verbose = false) {
    // Controllo prerequisites
    if (!Pacman.prerequisitesCheck()) {
      console.log('installing prerequisites...')
      Pacman.prerequisitesInstall(verbose)
    } else {
      console.log('prerequisites already present')
    }

    // Controllo configurazione
    if (!Pacman.configurationCheck()) {
      console.log('creating configuration...')
      Pacman.configurationInstall(verbose)
    } else {
      console.log('configuration present')
    }

    // show and edit configuration
    this.settings = new Settings()
    let config = {} as IConfig
    if (this.settings.load(verbose)) {
      // config.snapshot_dir = this.settings.snapshot_dir
      config.snapshot_basename = this.settings.snapshot_basename
      config.opt_user = this.settings.user_opt
      config.opt_user_passwd = this.settings.user_opt_passwd
      config.root_passwd = this.settings.root_passwd
      config.theme = 'ufficiozero' //this.settings.theme
      // config.make_efi = this.settings.make_efi
      // config.make_md5sum = this.settings.make_md5sum
      // config.make_isohybrid = this.settings.make_isohybrid
      // config.compression = this.settings.compression
      // config.ssh_pass = this.settings.ssh_pass
      // config.timezone = this.settings.timezone_opt

      await editConfig(config)

      // produce
      const myAddons = {} as IMyAddons
      const ovary = new Ovary('xz')
      await ovary.produce(config.snapshot_basename, false, false, false, config.theme, myAddons)
    }
  }
}

/**
 * 
 * @param c 
 */
async function editConfig(c) {
  return new Promise(function (resolve) {
    const questions: Array<Record<string, any>> = [
      {
        type: 'input',
        name: 'snapshot_basename:',
        message: 'ISO name',
        default: c.snapshot_basename
      },
      {
        type: 'input',
        name: 'opt_user',
        message: 'live user:',
        default: c.opt_user
      },
      {
        type: 'input',
        name: 'opt_user_passwd',
        message: 'live user password:',
        default: c.opt_user_passwd
      },
      {
        type: 'input',
        name: 'root_passwd',
        message: 'root password:',
        default: c.root_passwd
      },
      {
        type: 'input',
        name: 'theme',
        message: 'theme',
        default: c.theme
      }

    ]
    inquirer.prompt(questions).then(function (options) {
      resolve(JSON.stringify(options))
    })
  })
}
