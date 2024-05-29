/**
 * penguins-eggs
 * class: daddy.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'
import Settings from '../classes/settings'
import Compressors from '../classes/compressors'
const inquirer = require('inquirer') 

import {IEggsConfig} from '../interfaces/i-eggs-config'
import chalk from 'chalk'

// libraries
import { exec } from '../lib/utils'


interface editConf {
  snapshot_basename: string
  snapshot_prefix: string
  user_opt: string
  user_opt_passwd: string
  root_passwd: string
  theme: string
  compression: string
}

export default class Daddy {
  settings = {} as Settings

  async helpMe(loadDefault = false, verbose = false) {
    // Controllo configurazione
    if (!Pacman.configurationCheck()) {
      console.log('- creating configuration dir...')
      await Pacman.configurationInstall(verbose)
    }


    // Templates
    if (!Pacman.distroTemplateCheck()) {
      console.log('- distro template install...')
      await Pacman.distroTemplateInstall(verbose)
    }

    // show and edit configuration
    this.settings = new Settings()
    let config = {} as IEggsConfig
    if (await this.settings.load()) {
      config = this.settings.config
      let jsonConf: string
      if (!loadDefault) {
        jsonConf = await this.editConfig(config)
      } else {
        if (config.snapshot_prefix === '') {
          config.snapshot_prefix = Utils.snapshotPrefix(this.settings.distro.distroId, this.settings.distro.codenameId)
          config.compression = 'fast'
        }
        jsonConf = JSON.stringify(config)
      }
      const newConf = JSON.parse(jsonConf)
      // salvo le modifiche
      config.snapshot_basename = newConf.snapshot_basename
      config.snapshot_prefix = newConf.snapshot_prefix
      config.user_opt = newConf.user_opt
      config.user_opt_passwd = newConf.user_opt_passwd
      config.root_passwd = newConf.root_passwd
      config.theme = newConf.theme

      await this.settings.save(config)
      console.log()
      console.log(chalk.cyan('Your configuration was saved on: /etc/penguins-eggs.d'))
      console.log()
      console.log(chalk.cyan(`You can create a clean ISO with: `) + chalk.white(`sudo eggs produce`))
      console.log(chalk.cyan(`or a full personal clone: `) + chalk.white(`sudo eggs produce --clone`))
      console.log()
      console.log(chalk.cyan(`If you don't have enough space to remaster, you can mount`))
      console.log(chalk.cyan(`some remote or local space. Follow the samples:`))
      console.log(chalk.cyan(`- first, create an hidden mountpoint under the nest:`))
      console.log(chalk.white(`sudo mkdir /home/eggs/.mnt -p`))
      console.log(chalk.cyan(`- then, mount remote space:`))
      console.log(chalk.white(`sudo sshfs -o allow_other root@192.168.1.2:/zfs/iso /home/eggs/.mnt`))
      console.log(chalk.cyan('- or, mount a local partition:'))
      console.log(chalk.white(`sudo mount /dev/sdx1 /home/eggs/.mnt`))
      console.log()
      console.log(chalk.cyan('More help? ') + chalk.white('eggs mom'))
      // await exec(`cat /etc/penguins-eggs.d/eggs.yaml`)
    }
  }

  /**
   *
   * @param c
   */
  editConfig(c: IEggsConfig): Promise<string> {
    // Utils.titles('dad')
    console.log(chalk.cyan('Edit and save Live system parameters'))
    console.log()
    let compressionOpt = 0
    if (c.compression === 'xz') {
      compressionOpt = 1
    } else if (c.compression === 'xz -Xbcj x86') {
      compressionOpt = 2
    }

    if (c.snapshot_prefix === '') {
      c.snapshot_prefix = Utils.snapshotPrefix(this.settings.distro.distroId, this.settings.distro.codenameId)
    }

    return new Promise(function (resolve) {
      const questions: Array<Record<string, any>> = [
        {
          type: 'input',
          name: 'snapshot_prefix',
          message: 'LiveCD iso prefix: ',
          default: c.snapshot_prefix,
        },
        {
          type: 'input',
          name: 'snapshot_basename',
          message: 'LiveCD iso basename: ',
          default: c.snapshot_basename,
        },
        {
          type: 'input',
          name: 'user_opt',
          message: 'LiveCD user:',
          default: c.user_opt,
        },
        {
          type: 'input',
          name: 'user_opt_passwd',
          message: 'LiveCD user password: ',
          default: c.user_opt_passwd,
        },
        {
          type: 'input',
          name: 'root_passwd',
          message: 'LiveCD root password: ',
          default: c.root_passwd,
        },
        {
          type: 'list',
          name: 'compression',
          message: 'LiveCD compression: ',
          choices: ['fast', 'max'],
          default: compressionOpt,
        },
      ]
      inquirer.prompt(questions).then(function (options: any) {
        resolve(JSON.stringify(options))
      })
    })
  }
}