/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'
import path from 'path'
import fs from 'fs'
import Utils from '../classes/utils'
import Settings from '../classes/settings'
import Incubator from '../classes/incubation/incubator'
import Pacman from '../classes/pacman'
import { IRemix } from '../interfaces/index'

export default class Calamares extends Command {
  static flags = {
    help: Flags.help({ char: 'h' }),
    install: Flags.boolean({ char: 'i', description: "install calamares and its dependencies" }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    noicons: Flags.boolean({ char: 'N', description: 'no icons' }),
    release: Flags.boolean({ char: 'r', description: "release: remove calamares and all its dependencies after the installation" }),
    remove: Flags.boolean({ description: "remove calamares and its dependencies" }),
    theme: Flags.string({ description: 'theme/branding for eggs and calamares' }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  static description = 'configure calamares or install or configure it'
  static examples = [
    'sudo eggs calamares',
    'sudo eggs calamares --install',
    'sudo eggs calamares --install --theme=/path/to/theme',
    'sudo eggs calamares --remove',
  ]

  remix = {} as IRemix

  incubator = {} as Incubator

  settings = {} as Settings

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    this.settings = new Settings()

    const { flags } = await this.parse(Calamares)
    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    let remove = false
    if (flags.remove) {
      remove = true
    }

    let install = false
    if (flags.install) {
      install = true
    }

    let release = false
    if (flags.release) {
      release = true
    }

    let theme = 'eggs'
    if (flags.theme !== undefined) {
      theme = flags.theme
      if (theme.endsWith('/')) {
        theme = theme.substring(0, theme.length - 1)
      }
      theme = path.resolve(theme)
      if (!fs.existsSync(theme + '/theme')) {
        console.log('Cannot find theme: ' + theme)
        process.exit()
      }
    }
    console.log(`theme: ${theme}`)

    const nointeractive = flags.nointeractive
    const noicons = flags.noicons

    if (Utils.isRoot(this.id)) {
      let installer = 'krill'
      if (Pacman.isInstalledGui()) {
        installer = 'calamares'
      }

      if (!noicons) { // se VOGLIO le icone
        if (installer === 'calamares') {
          if (!remove) {
            if (!nointeractive || await Utils.customConfirm('Select yes to continue...')) {
              /**
               * Install calamares
               */
              if (install) {
                Utils.warning('Installing calamares...')
                await Pacman.calamaresInstall()
                if (await this.settings.load()) {
                  this.settings.config.force_installer = true
                  this.settings.save(this.settings.config)
                  await Pacman.calamaresPolicies()
                }
              }

              /**
               * Configure calamares
               */
              if (await this.settings.load()) {
                Utils.warning('Configuring installer')
                await this.settings.loadRemix(this.settings.config.snapshot_basename, theme)
                this.incubator = new Incubator(this.settings.remix, this.settings.distro, this.settings.config.user_opt, theme, verbose)
                await this.incubator.config(release)
              }
            }
          } else {
            /**
             * Remove calamares
             */
            if (Pacman.calamaresExists()) {
              await Pacman.calamaresRemove()
              if (await this.settings.load()) {
                this.settings.config.force_installer = false
                this.settings.save(this.settings.config)
              }
            }
          }
        }
      } else if ((await Utils.customConfirm('Select yes to continue...')) && (await this.settings.load())) {
        Utils.warning('Configuring krill')
        await this.settings.loadRemix(this.settings.config.snapshot_basename, theme)
        this.incubator = new Incubator(this.settings.remix, this.settings.distro, this.settings.config.user_opt, theme, verbose)
        console.log('calamares release: ' + release)
        await this.incubator.config(release)
      }
    }
  }
}
