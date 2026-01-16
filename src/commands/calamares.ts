/**
 * ./src/commands/calamares.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'

import Incubator from '../classes/incubation/incubator.js'
import Pacman from '../classes/pacman.js'
import Settings from '../classes/settings.js'
import Utils from '../classes/utils.js'
import { IRemix } from '../interfaces/index.js'

export default class Calamares extends Command {
  static description = 'a GUI system installer - install and configure calamares'
static examples = ['sudo eggs calamares', 'sudo eggs calamares --install', 'sudo eggs calamares --install --theme=/path/to/theme', 'sudo eggs calamares --remove']
static flags = {
    help: Flags.help({ char: 'h' }),
    install: Flags.boolean({ char: 'i', description: 'install calamares and its dependencies' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    policies: Flags.boolean({ char: 'p', description: 'configure calamares policies' }),
    release: Flags.boolean({ char: 'r', description: 'release: remove calamares and all its dependencies after the installation' }),
    remove: Flags.boolean({ description: 'remove calamares and its dependencies' }),
    theme: Flags.string({ description: 'theme/branding for eggs and calamares' }),
    verbose: Flags.boolean({ char: 'v' })
  }
incubator = {} as Incubator
remix = {} as IRemix
settings = {} as Settings

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)
  
    this.settings = new Settings()

    const { flags } = await this.parse(Calamares)

    const { verbose } = flags

    const { remove } = flags

    const { install } = flags

    const { release } = flags

    const { nointeractive } = flags

    let { policies } = flags

    let theme = 'eggs'

    if (flags.theme !== undefined) {
      theme = flags.theme
      if (theme.includes('/')) {
        if (theme.endsWith('/')) {
          theme = theme.slice(0, Math.max(0, theme.length - 1))
        }
      } else {
        const wpath = `/home/${await Utils.getPrimaryUser()}/.wardrobe/vendors/`
        theme = wpath + flags.theme
      }

      theme = path.resolve(theme)
      if (!fs.existsSync(theme + '/theme')) {
        console.log('Cannot find theme: ' + theme)
        process.exit()
      }
    }

    console.log(`theme: ${theme}`)

    let installer = 'krill'
    if (Pacman.calamaresExists()) {
      installer = 'calamares'
    }

    if (Utils.isRoot(this.id)) {

      if (!nointeractive || (await Utils.customConfirm('Select yes to continue...'))) {
        if (remove) {
          if (Pacman.calamaresExists()) {
            await Pacman.calamaresRemove()
            if (await this.settings.load()) {
              this.settings.config.force_installer = false
              this.settings.save(this.settings.config)
              installer = "krill"
            }
          }

          process.exit()
        }

        /**
         * Install
         */
        if (install) {
          Utils.warning('installing package calamares')
          await Pacman.calamaresInstall()
          if (await this.settings.load()) {
            this.settings.config.force_installer = true
            this.settings.save(this.settings.config)
            policies = true
            installer = "calamares"
          }
        }
      }

      /**
       * policies
       */
      if (policies) {
        Utils.warning('configuring calamares policies')
        await Pacman.calamaresPolicies()
      }

      /**
       * configure
       */
      if (await this.settings.load()) {
        await this.settings.loadRemix(theme)
        const isClone = false
        this.incubator = new Incubator(this.settings.remix, this.settings.distro, this.settings.config.user_opt, theme, isClone, verbose)
        await this.incubator.config(release)
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
