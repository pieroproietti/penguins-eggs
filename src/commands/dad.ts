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
import { IConfig } from '../interfaces'
import yaml = require('js-yaml')
import fs = require('fs')

import { IMyAddons } from '../interfaces'

const exec = require('../lib/utils').exec

interface editConf {
  snapshot_basename: string
  snapshot_prefix: string
  opt_user: string
  opt_user_passwd: string
  root_passwd: string
  theme: string
  compression: string
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
    Utils.titles('dad: Daddy, what else did you leave for me?')
    const { args, flags } = this.parse(Dad)

    this.daddy(flags.verbose)
  }

  /**
   * 
   */
  async daddy(verbose = false) {
    if (Utils.isRoot()) {

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
      if (await this.settings.load()) {
        config.version = this.settings.version
        config.snapshot_excludes = this.settings.snapshot_excludes
        config.snapshot_dir = this.settings.snapshot_dir
        config.snapshot_basename = this.settings.snapshot_basename
        config.snapshot_prefix = this.settings.snapshot_prefix
        config.opt_user = this.settings.user_opt
        config.opt_user_passwd = this.settings.user_opt_passwd
        config.root_passwd = this.settings.root_passwd
        config.theme = 'ufficiozero' //this.settings.theme
        config.make_efi = this.settings.make_efi
        config.make_md5sum = this.settings.make_md5sum
        config.make_isohybrid = this.settings.make_isohybrid
        config.compression = this.settings.compression
        config.ssh_pass = this.settings.ssh_pass
        config.timezone = this.settings.timezone_opt
        config.pmount_fixed = this.settings.pmount_fixed
        config.netconfig_opt = this.settings.netconfig_opt
        config.ifnames_opt = this.settings.ifnames_opt
        config.locales = this.settings.locales
        config.locales_default = this.settings.locales_default
        // Edito i campi
        let nc: string = await editConfig(config)
        let newConf = JSON.parse(nc)
        // salvo le mdifiche      
        config.snapshot_basename = newConf.snapshot_basename
        config.snapshot_prefix = newConf.snapshot_prefix
        config.opt_user = newConf.opt_user
        config.opt_user_passwd = newConf.opt_user_passwd
        config.root_passwd = newConf.root_passwd
        config.theme = newConf.theme
        config.compression = newConf.compression
        await this.settings.save(config)

        // Controllo se serve il kill
        Utils.titles('eggs kill Daddy, what else did you leave for me?')
        await this.settings.listFreeSpace()
        if (await Utils.customConfirm()) {
          await exec(`rm ${this.settings.work_dir.path} -rf`)
          await exec(`rm ${this.settings.snapshot_dir} -rf`)
        }

        // produce
        Utils.titles('eggs produce Daddy, what else did you leave for me?')
        const myAddons = {} as IMyAddons
        const ovary = new Ovary(config.compression)
        if (await ovary.fertilization()) {
          await ovary.produce(config.snapshot_basename, false, false, false, config.theme, myAddons, verbose)
          ovary.finished(false)
        }
      }
    }
  }
}

/**
 * 
 * @param c 
 */
function editConfig(c: IConfig): Promise<string> {
  return new Promise(function (resolve) {
    const questions: Array<Record<string, any>> = [
      {
        type: 'input',
        name: 'snapshot_basename',
        message: 'basename',
        default: c.snapshot_basename
      },
      {
        type: 'input',
        name: 'snapshot_prefix',
        message: 'prefix',
        default: c.snapshot_prefix
      },
      {
        type: 'input',
        name: 'opt_user',
        message: 'opt user:',
        default: c.opt_user
      },
      {
        type: 'input',
        name: 'opt_user_passwd',
        message: 'opt user password',
        default: c.opt_user_passwd
      },
      {
        type: 'input',
        name: 'root_passwd',
        message: 'root password',
        default: c.root_passwd
      },
      {
        type: 'input',
        name: 'theme',
        message: 'theme',
        default: c.theme
      },
      {
        type: 'input',
        name: 'compression',
        message: 'compression',
        default: c.compression
      }

    ]
    inquirer.prompt(questions).then(function (options) {
      resolve(JSON.stringify(options))
    })
  })
}
