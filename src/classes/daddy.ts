/**
 * ./src/classes/daddy.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'
import inquirer from 'inquirer'
import yaml from 'js-yaml'
import fs from 'node:fs'
// _dirname
import path from 'node:path'
import { exec } from '../lib/utils.js'

// We need to remove .js extension from import
import Pacman from '../classes/pacman.js'
import Settings from '../classes/settings.js'
import Utils from '../classes/utils.js'
import { IEggsConfig } from '../interfaces/i-eggs-config.js'
const __dirname = path.dirname(new URL(import.meta.url).pathname)

interface editConf {
  compression: string
  root_passwd: string
  snapshot_basename: string
  snapshot_prefix: string
  theme: string
  user_opt: string
  user_opt_passwd: string
}

export default class Daddy {
  settings = {} as Settings

  /**
   * editConfif
   * @param c
   * @returns
   */
  async editConfig(c: IEggsConfig): Promise<string> {
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

    return new Promise((resolve) => {
      
      const questions: any = [
        {
          default: c.snapshot_prefix,
          message: 'LiveCD iso prefix: ',
          name: 'snapshot_prefix',
          type: 'input'
        },
        {
          default: c.snapshot_basename,
          message: 'LiveCD iso basename: ',
          name: 'snapshot_basename',
          type: 'input'
        },
        {
          default: c.user_opt,
          message: 'LiveCD user:',
          name: 'user_opt',
          type: 'input'
        },
        {
          default: c.user_opt_passwd,
          message: 'LiveCD user password: ',
          name: 'user_opt_passwd',
          type: 'input'
        },
        {
          default: c.root_passwd,
          message: 'LiveCD root password: ',
          name: 'root_passwd',
          type: 'input'
        },
        {
          choices: ['fast', 'max'],
          default: compressionOpt,
          message: 'LiveCD compression: ',
          name: 'compression',
          type: 'list'
        }
      ]
      inquirer.prompt(questions).then((options: any) => {
        resolve(JSON.stringify(options))
      })
    })
  }

  /**
   *
   * @param reset
   * @param isCustom
   * @param fileCustom
   * @param verbose
   */
  async helpMe(reset = false, isCustom = false, fileCustom = '', verbose = false) {
    if (isCustom) {
      console.log('using custom file:', fileCustom)
    }

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

    //Calamares 
    if (!Pacman.calamaresExists() && 
        Pacman.isInstalledGui() && 
        Pacman.isCalamaresAvailable()) {

      console.log('- this is a GUI system, calamares is available, but NOT installed')
    }
          

    // show and edit configuration
    this.settings = new Settings()
    let config = {} as IEggsConfig
    let jsonConf = ''
    if (await this.settings.load()) {
      config = this.settings.config
      config.compression = 'fast'

      if (reset || isCustom) {
        if (config.snapshot_prefix === '') {
          let fstype=((await exec(`findmnt -n -o FSTYPE /`,{capture: true})).data.trim())
          if (fstype !=='ext4'){
              fstype +='-'
          } else {
            fstype =''            
          }
          config.snapshot_prefix = Utils.snapshotPrefix(this.settings.distro.distroId, this.settings.distro.codenameId) + fstype
        }

        jsonConf = JSON.stringify(config)
      } else {
        jsonConf = await this.editConfig(config)
      }

      // Custom configuration
      if (isCustom) {
        const conf = fs.readFileSync(fileCustom, 'utf8')
        const confCustom = yaml.load(conf) as editConf
        config.snapshot_basename = confCustom.snapshot_basename
        config.snapshot_prefix = confCustom.snapshot_prefix
        config.user_opt = confCustom.user_opt
        config.user_opt_passwd = confCustom.user_opt_passwd
        config.root_passwd = confCustom.root_passwd
        config.theme = confCustom.theme
        jsonConf = JSON.stringify(config)
      }

      // Save new configuration
      const confNew = JSON.parse(jsonConf)
      config.snapshot_basename = confNew.snapshot_basename
      config.snapshot_prefix = confNew.snapshot_prefix
      config.user_opt = confNew.user_opt
      config.user_opt_passwd = confNew.user_opt_passwd
      config.root_passwd = confNew.root_passwd
      config.theme = confNew.theme
      await this.settings.save(config)
    }

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
  }
}
