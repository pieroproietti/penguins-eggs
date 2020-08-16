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
      dry: flags.boolean({
         char: 'd',
         description:
            'perform a dry run, no iso build but only scripts generated'
      }),
      assistant: flags.boolean({ char: 'a', description: 'install assistant' }),
      branding: flags.string({
         description: 'brand for calamares default eggs'
      }),
      addons: flags.string({ multiple: true, description: 'plugins to be used'}),
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }

   static description = 'livecd creation. (the penguin produce an egg)'

   static aliases = ['spawn', 'lay']

   static examples = [
      `$ eggs produce --basename egg
the penguin produce an egg called egg-i386-2020-04-13_1815.iso`
   ]

   async run() {
      Utils.titles('produce')

      const { flags } = this.parse(Produce)
      if (Utils.isRoot()) {
         let addons = []
         if (flags.addons){
            console.log(`addons: ${flags.addons}`)
            addons = flags.addons //array
            addons.forEach(addon => {
               console.log('----------------------------------')

               let dirAddon =path.resolve(__dirname, `../../addons/${addon}`)
               console.log(`dirAddon: ${dirAddon}`)
               if (!fs.existsSync(dirAddon)){
                  console.log(`addon: ${addon} not found`)
                  return
               }

               let vendorAddon = addon.substring(0, addon.search('/') )
               console.log(`vendorAddon: ${vendorAddon}`)
               let nameAddon = addon.substring(addon.search('/')+1, addon.length )
               console.log(`nameAddon: ${nameAddon}`)

               /**
                * Impostazione dei flags singoli
                */
               if (nameAddon === 'thema'){
                  flags.branding = vendorAddon
               }
               if (nameAddon === 'assistant'){
                  flags.assistant = true
               }
               if (nameAddon === 'remote-assistant'){
                  flags.assistant = true
               }
            })
         }



         // Nome della remix
         let basename = '' // se vuoto viene definito da loadsetting
         if (flags.basename !== undefined) {
            basename = flags.basename
            console.log(`basename: ${basename}`)
         }

         // Nome del brand di calamares
         let branding = 'eggs'
         if (flags.branding !== undefined) {
            branding = flags.branding
            console.log(`calamares branding: ${branding}`)
         }

         let compression = '' // se vuota, compression viene definita da loadsettings
         if (flags.fast) {
            compression = 'lz4'
         } else if (flags.compress) {
            compression = 'xz -Xbcj x86'
         }

         let assistant = false
         if (flags.assistant) {
            assistant = true
         }

         let verbose = false
         if (flags.verbose) {
            verbose = true
         }

         let dry = false
         if (flags.dry) {
            dry = true
         }

         if (!Pacman.prerequisitesEggsCheck()) {
            console.log(
               'You need to install ' +
               chalk.bgGray('prerequisites') +
               ' to continue.'
            )
            if (
               await Utils.customConfirm(`Select yes to install prerequisites`)
            ) {
               Utils.warning('Installing prerequisites...')
               await Pacman.prerequisitesEggsInstall(verbose)
               await Pacman.clean(verbose)
            } else {
               Utils.error(
                  'To create iso, you must install eggs prerequisites.\nsudo eggs prerequisites'
               )
               process.exit(0)
            }
         }

         if (!Pacman.configurationCheck()) {
            console.log(
               'You need to create ' +
               chalk.bgGray('configuration files') +
               ' to continue.'
            )
            if (
               await Utils.customConfirm(
                  `Select yes to create configuration files`
               )
            ) {
               Utils.warning('Creating configuration files...')
               await Pacman.configurationInstall(verbose)
            } else {
               Utils.error(
                  'Cannot find configuration files, You must to create it. \nsudo eggs prerequisites -c'
               )
               process.exit(0)
            }
         }

         const ovary = new Ovary(compression)
         Utils.warning('Produce an egg...')
         if (await ovary.fertilization()) {
            await ovary.produce(basename, branding, assistant, verbose, dry)
            ovary.finished(dry)
         }
      }
   }
}
