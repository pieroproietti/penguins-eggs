/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'
import Utils from '../classes/utils'
import Ovary from '../classes/ovary'
import Compressors from '../classes/compressors'
import Config from './config'
import chalk from 'chalk'
import { IMyAddons } from '../interfaces'
import fs from 'node:fs'
import path from 'node:path'


export default class Produce extends Command {
  static flags = {
    addons: Flags.string({ multiple: true, description: 'addons to be used: adapt, ichoice, pve, rsupport' }),
    clonecrypted: Flags.boolean({ char: 'C', description: 'clone crypted' }),
    basename: Flags.string({ description: 'basename' }),
    clone: Flags.boolean({ char: 'c', description: 'clone' }),
    fast: Flags.boolean({ char: 'f', description: 'fast compression' }),
    help: Flags.help({ char: 'h' }),
    max: Flags.boolean({ char: 'm', description: 'max compression' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'don\'t ask for user interctions' }),
    prefix: Flags.string({ char: 'p', description: 'prefix' }),
    release: Flags.boolean({ description: 'release: max compression, remove penguins-eggs and calamares after installation' }),
    script: Flags.boolean({ char: 's', description: 'script mode. Generate scripts to manage iso build' }),
    theme: Flags.string({ description: 'theme for livecd, calamares branding and partitions' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
    yolk: Flags.boolean({ char: 'y', description: '-y force yolk renew' }),
  }

  static description = 'produce a live image from your system whithout your data'
  static examples = [
    "sudo eggs produce",
    "sudo eggs produce --fast",
    "sudo eggs produce --max",
    "sudo eggs produce --fast --basename=colibri",
    "sudo eggs produce --fast --basename=colibri --theme /path/to/theme --addons adapt",
    "sudo eggs produce --fast --clone",
    "sudo eggs produce --fast --backup",
  ]

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Produce)
    if (Utils.isRoot()) {
      /**
       * ADDONS dei vendors
       * Fino a 3
       */
      const addons = []
      if (flags.addons) {
        const addons = flags.addons // array
        for (let addon of addons) {
          // se non viene specificato il vendor il default è eggs
          if (!addon.includes('//')) {
            addon = 'eggs/' + addon
          }

          const dirAddon = path.resolve(__dirname, `../../addons/${addon}`)
          if (!fs.existsSync(dirAddon)) {
            console.log(dirAddon)
            Utils.warning('addon: ' + chalk.white(addon) + ' not found, terminate!')
            process.exit()
          }

          const vendorAddon = addon.slice(0, Math.max(0, addon.search('/')))
          const nameAddon = addon.substring(addon.search('/') + 1, addon.length)
          if (nameAddon === 'theme') {
            flags.theme = vendorAddon
          }
        }
      }

      /**
       * composizione dei flag
       */

      let prefix = ''
      if (flags.prefix !== undefined) {
        prefix = flags.prefix
      }

      let basename = '' // se vuoto viene definito da loadsetting (default nome dell'host)
      if (flags.basename !== undefined) {
        basename = flags.basename
      }

      const compressors = new Compressors()
      await compressors.populate()

      let compression = compressors.normal()
      if (flags.max) {
        compression = compressors.max()
      } else if (flags.fast) {
        compression = compressors.fast()
      }

      const release = flags.release

      const clonecrypted = flags.clonecrypted

      const clone = flags.clone

      const verbose = flags.verbose

      const scriptOnly = flags.script

      const yolkRenew = flags.yolk

      const nointeractive = flags.nointeractive



      /**
       * theme: if not defined will use eggs
       */
      let theme = 'eggs'
      if (flags.theme !== undefined) {
        theme = flags.theme
        if (theme.includes('/')) {
          if (theme.endsWith('/')) {
            theme = theme.substring(0, theme.length -1)
          }
          if (!fs.existsSync(theme + '/theme')) {
            console.log('Cannot find theme: ' + theme)
            process.exit()
          }
        }
      }


      const i = await Config.thatWeNeed(nointeractive, verbose, clonecrypted)
      if ((i.needApt || i.configurationInstall || i.configurationRefresh || i.distroTemplate) && (await Utils.customConfirm('Select yes to continue...'))) {
        await Config.install(i, verbose)
      }

      const myAddons = {} as IMyAddons
      if (flags.addons != undefined) {
        if (flags.addons.includes('adapt')) {
          myAddons.adapt = true
        }

        if (flags.addons.includes('ichoice')) {
          myAddons.ichoice = true
        }

        if (flags.addons.includes('pve')) {
          myAddons.pve = true
        }

        if (flags.addons.includes('rsupport')) {
          myAddons.rsupport = true
        }
      }

      Utils.titles(this.id + ' ' + this.argv)
      const ovary = new Ovary()
      Utils.warning('Produce an egg...')
      if (await ovary.fertilization(prefix, basename, theme, compression, !nointeractive)) {
        await ovary.produce(clonecrypted, clone, scriptOnly, yolkRenew, release, myAddons, nointeractive, verbose)
        ovary.finished(scriptOnly)
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
