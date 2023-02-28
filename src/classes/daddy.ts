/**
 * penguins-eggs-v8
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'
import Settings from '../classes/settings'
import Ovary from '../classes/ovary'
import Compressors from '../classes/compressors'
import inquirer from 'inquirer'
import {IEggsConfig} from '../interfaces'
import {IMyAddons} from '../interfaces'
import chalk from 'chalk'
import {exec} from '../lib/utils'

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

    // Controllo prerequisites
    if (!(await Pacman.prerequisitesCheck())) {
      console.log('- installing prerequisites...')
      await Pacman.prerequisitesInstall(verbose)
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

      /**
       * Analisi del tipo di compressione disponibile
       */
      const compressors = new Compressors()
      await compressors.populate()
      config.compression = compressors.normal()
      if (newConf.compression === 'fast') {
        config.compression = compressors.fast()
      } else if (newConf.compression === 'max') {
        config.compression = compressors.max()
      }

      await this.settings.save(config)

      let flags = ''
      if (loadDefault) {
        await exec(`rm ${this.settings.work_dir.path} -rf`)
        await exec(`rm ${this.settings.config.snapshot_dir} -rf`)
      } else {
        // Controllo se serve il kill
        if (verbose) {
          flags = '--verbose '
        }

        Utils.titles('kill' + flags)
        console.log(chalk.cyan('Daddy, what else did you leave for me?'))
        await this.settings.listFreeSpace()
        if (await Utils.customConfirm()) {
          await exec(`rm ${this.settings.work_dir.path} -rf`)
          await exec(`rm ${this.settings.config.snapshot_dir} -rf`)
        }

        /**
         * produce
         */
        if (loadDefault) {
          verbose = false
        }

        flags += ' --' + newConf.compression
        flags += ' --addons adapt'
        Utils.titles('produce' + ' ' + flags)
        console.log(chalk.cyan('Daddy, what else did you leave for me?'))
        const myAddons = {} as IMyAddons
        myAddons.adapt = true
        const backup = false
        const personal = false
        const scriptOnly = false
        const yolkRenew = false
        const final = false
        const ovary = new Ovary()
        Utils.warning('Produce an egg...')
        if (await ovary.fertilization(config.snapshot_prefix, config.snapshot_basename, config.theme, config.compression)) {
          await ovary.produce(backup, personal, scriptOnly, yolkRenew, final, myAddons, verbose)
          ovary.finished(scriptOnly)
        }
      }
    }
  }

  /**
   *
   * @param c
   */
  editConfig(c: IEggsConfig): Promise<string> {
    console.log(chalk.cyan('Edit and save LiveCD parameters'))
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
          type: 'input',
          name: 'theme',
          message: 'LiveCD theme: ',
          default: c.theme,
        },
        {
          type: 'list',
          name: 'compression',
          message: 'LiveCD compression: ',
          choices: ['fast', 'normal', 'max'],
          default: compressionOpt,
        },
      ]
      inquirer.prompt(questions).then(function (options) {
        resolve(JSON.stringify(options))
      })
    })
  }
}
