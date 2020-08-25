/* eslint-disable unicorn/no-process-exit */
/* eslint-disable no-process-exit */
/* eslint-disable no-console */
/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import fs = require('fs')
import path = require('path')
import Utils from '../classes/utils'
import Ovary from '../classes/ovary'
import Pacman from '../classes/pacman'
import chalk = require('chalk')
import { string } from '@oclif/command/lib/flags'
import { fstat } from 'fs'
import { IMyAddons } from '../interfaces'

export default class Produce extends Command {
   static flags = {
      basename: flags.string({ char: 'b', description: 'basename egg' }),
      compress: flags.boolean({ char: 'c', description: 'max compression' }),
      fast: flags.boolean({ char: 'f', description: 'fast compression' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' }),
      script: flags.boolean({char: 's', description: 'script mode. Generate scripts to manage iso build' }),
      help: flags.help({ char: 'h' }),

      // addon vendor/addon configurazioni dei vendors
      theme: flags.string({ description: 'theme/branding for eggs and calamares' }),
      // addons: flags.string({ multiple: true, description: 'addons to be used' }),

      // addon per prodotti di terze parti, presenti SOLO in eggs
      adapt: flags.boolean({ description: 'adapt video resolution in VM' }),
      ichoice: flags.boolean({ description: 'allows the user to choose the installation type cli/gui' }),
      rsupport: flags.boolean({ description: `remote support via dwagent` }),
      pve: flags.boolean({ description: `administration of virtual machines (Proxmox-VE)` })
   }

   static description = 'livecd creation. The system produce an egg'

   static aliases = ['spawn', 'lay']

   static examples = [
      `$ sudo eggs produce \nproduce an ISO called [hostname]-[arch]-YYYY-MM-DD_HHMM.iso, compressed xz (standard compression).\nIf hostname=myremix and arch=i386 you have myremix-x86--2020-08-25_1215.iso\n`,
      `$ sudo eggs produce -v\nthe same as the previuos, but with more explicative output\n`,
      `$ sudo eggs produce -vf\nthe same as the previuos, compression lz4 (fast compression, but about 30% less compared xz standard)\n`,
      `$ sudo eggs produce -vc\nthe same as the previuos, compression xz -Xbcj x86 (max compression, about 10% more compared xz standard)\n`,
      `$ sudo eggs produce -vf --basename leo --theme debian --adapt \nproduce an ISO called leo-i386-2020-08-25_1215.iso compression lz4, using Debian theme and link to adapt\n`,
      `$ sudo eggs produce -v --basename leo --theme debian --adapt \nproduce an ISO called leo-i386-2020-08-25_1215.iso compression xz, using Debian theme and link to adapt\n`,
      `$ sudo eggs produce -v --basename leo --rsupport \nproduce an ISO called leo-i386-2020-08-25_1215.iso compression xz, using eggs theme and link to dwagent\n`,
      `$ sudo eggs produce -vs --basename leo --rsupport \nproduce scripts to build an ISO as the previus example. Scripts can be found in /home/eggs/ovarium and you can customize all you need\n`,
   ]

   async run() {
      Utils.titles('produce')
      const { flags } = this.parse(Produce)
      if (Utils.isRoot()) {




         /**
          * ADDONS dei vendors
          */
         /*
         let addons = []
         if (flags.addons) {
            console.log(`addons: ${flags.addons}`)
            addons = flags.addons //array
            addons.forEach(addon => {
               let dirAddon = path.resolve(__dirname, `../../addons/${addon}`)
               // console.log(`dirAddon: ${dirAddon}`)
               if (!fs.existsSync(dirAddon)) {
                  console.log(`addon: ${addon} not found`)
                  return
               }

               let vendorAddon = addon.substring(0, addon.search('/'))
               // console.log(`vendorAddon: ${vendorAddon}`)
               let nameAddon = addon.substring(addon.search('/') + 1, addon.length)
               // Impostazione dei flag theme ed installed_choice se usati come addons
               if (nameAddon === 'theme') {
                  flags.theme = vendorAddon
               }
            })
         }
         */

         /**
          * composizione dei flag
          */
         let basename = '' // se vuoto viene definito da loadsetting (default nome dell'host)
         if (flags.basename !== undefined) {
            basename = flags.basename
            console.log(`basename: ${basename}`)
         }

         let compression = '' // se vuota, compression viene definita da loadsettings, default xz
         if (flags.fast) {
            compression = 'lz4'
         } else if (flags.compress) {
            compression = 'xz -Xbcj x86'
         }

         let verbose = false
         if (flags.verbose) {
            verbose = true
         }

         let script = false
         if (flags.script) {
            script = true
         }

         let theme = 'eggs'
         if (flags.theme !== undefined) {
            theme = flags.theme
            console.log(`theme: ${theme}`)
         }

         let myAddons = {} as IMyAddons
         myAddons.rsupport = flags.adapt
         myAddons.rsupport = flags.rsupport
         myAddons.ichoice = flags.ichoice
         myAddons.pve = flags.pve

         if (!Pacman.prerequisitesEggsCheck()) {
            console.log('You need to install ' + chalk.bgGray('prerequisites') + ' to continue.'
            )
            if (await Utils.customConfirm(`Select yes to install prerequisites`)) {
               Utils.warning('Installing prerequisites...')
               await Pacman.prerequisitesEggsInstall(verbose)
               await Pacman.clean(verbose)
            } else {
               Utils.error('To create iso, you must install eggs prerequisites.\nsudo eggs prerequisites')
               process.exit(0)
            }
         }

         if (!Pacman.configurationCheck()) {
            console.log('You need to create ' + chalk.bgGray('configuration files') +' to continue.')
            if (await Utils.customConfirm(`Select yes to create configuration files`)) {
               Utils.warning('Creating configuration files...')
               await Pacman.configurationInstall(verbose)
            } else {
               Utils.error('Cannot find configuration files, You must to create it. \nsudo eggs prerequisites -c')
               process.exit(0)
            }
         }

         const ovary = new Ovary(compression)
         Utils.warning('Produce an egg...')
         if (await ovary.fertilization()) {
            await ovary.produce(basename, script, theme, myAddons, verbose)
            ovary.finished(script)
         }
      }
   }
}
