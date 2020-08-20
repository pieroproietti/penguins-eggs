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

export default class Produce extends Command {
   static flags = {
      basename: flags.string({ char: 'b', description: 'basename egg' }),
      compress: flags.boolean({ char: 'c', description: 'max compression' }),
      fast: flags.boolean({ char: 'f', description: 'fast compression' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' }),
      script_only: flags.boolean({char: 's', description: 'only scripts generation' }),
      help: flags.help({ char: 'h' }),

      // addon vendor/addon configurazioni dei vendors
      theme: flags.string({ description: 'theme for eggs' }),
      installer_choice: flags.string({ description: 'install assistant' }),
      // addons: flags.string({ multiple: true, description: 'addons to be used' }),

      // addon per prodotti di terze parti, presenti SOLO in eggs
      dwagent: flags.boolean({ description: `dwagent remote support` }),
      // proxmox_ve: flags.boolean({ description: `Proxmox-VE support` })
   }

   static description = 'livecd creation. The system produce an egg'

   static aliases = ['spawn', 'lay']

   static examples = [
      `$ eggs produce --basename egg
the penguin produce an egg called egg-i386-2020-04-13_1815.iso`
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

         let script_only = false
         if (flags.script_only) {
            script_only = true
         }

         let theme = 'eggs'
         if (flags.theme !== undefined) {
            theme = flags.theme
            console.log(`theme: ${theme}`)
         }


         let dwagent = false
         if (flags.dwagent) {
              dwagent = true
         }

         let installer_choice = ""
         if (flags.installer_choice !== undefined) {
            installer_choice = flags.installer_choice
         }

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
            await ovary.produce(basename, script_only, theme, installer_choice, dwagent, verbose)
            ovary.finished(script_only)
         }
      }
   }
}
