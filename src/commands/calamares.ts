/**
 * penguins-eggs
 * command: calamares.ts
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
    policies: Flags.boolean({ char: 'p', description: 'configure calamares policies' }),
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
    let verbose = flags.verbose

    let remove = flags.remove

    let install = flags.install

    let release = flags.release

    let theme = 'eggs'
    if (flags.theme !== undefined) {
      theme = flags.theme
      if (theme.includes('/')) {
        if (theme.endsWith('/')) {
          theme = theme.substring(0, theme.length - 1)
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
    let policies = flags.policies
    const nointeractive = flags.nointeractive

    if (Utils.isRoot(this.id)) {
      let installer = 'krill'
      if (Pacman.isInstalledGui()) {
        installer = 'calamares'
      }

      if (installer === 'calamares') {
        if (!nointeractive || await Utils.customConfirm('Select yes to continue...')) {
          if (remove) {
            if (Pacman.calamaresExists()) {
              await Pacman.calamaresRemove()
              if (await this.settings.load()) {
                this.settings.config.force_installer = false
                this.settings.save(this.settings.config)
              }
            }
            process.exit()
          }

          /**
           * Install
           */
          if (install) {
            Utils.warning('Installing calamares')
            await Pacman.calamaresInstall()
            if (await this.settings.load()) {
              this.settings.config.force_installer = true
              this.settings.save(this.settings.config)
              policies = true
            }
          }

          /**
           * Configure
           */
          if (await this.settings.load()) {
            Utils.warning('Configuring calamares')
            await this.settings.loadRemix(this.settings.config.snapshot_basename, theme)
            const isClone = false
            this.incubator = new Incubator(this.settings.remix, this.settings.distro, this.settings.config.user_opt, theme, isClone, verbose)
            await this.incubator.config(release)
          }

          /**
           * policies
           */
          if (policies) {
            Utils.warning('Configuring policies')
            await Pacman.calamaresPolicies()
          }
        }
      }
    }
  }
}

