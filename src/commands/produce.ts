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
import Utils from '../classes/utils'
import Ovary from '../classes/ovary'
import Pacman from '../classes/pacman'
import chalk = require('chalk')
import { IMyAddons } from '../interfaces'
import Prequisites from '../commands/prerequisites'
import Prerequisites from '../commands/prerequisites'

export default class Produce extends Command {
   static flags = {
      prefix: flags.string({ char: 'p', description: 'prefix' }),
      basename: flags.string({ char: 'b', description: 'basename' }),
      normal: flags.boolean({ char: 'n', description: 'normal compression' }),
      max: flags.boolean({ char: 'm', description: 'max compression' }),
      fast: flags.boolean({ char: 'f', description: 'fast compression' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' }),
      yolk: flags.boolean({ char: 'y', description: '-y force yolk renew' }),
      script: flags.boolean({ char: 's', description: 'script mode. Generate scripts to manage iso build' }),
      help: flags.help({ char: 'h' }),

      // addon vendor/addon configurazioni dei vendors
      final: flags.boolean({ description: 'final: remove eggs prerequisites, calamares and all it\'s dependencies' }),
      theme: flags.string({ description: 'theme/branding for eggs and calamares' }),
      // addons: flags.string({ multiple: true, description: 'addons to be used' }),

      // addon per prodotti di terze parti, presenti SOLO in eggs
      adapt: flags.boolean({ description: 'adapt video resolution in VM' }),
      ichoice: flags.boolean({ description: 'allows the user to choose the installation type cli/gui' }),
      rsupport: flags.boolean({ description: `remote support via dwagent` }),
      pve: flags.boolean({ description: `administration of virtual machines (Proxmox-VE)` })
   }

   static description = 'the system produce an egg: livecd creation.'

   static aliases = ['spawn', 'lay']

   static examples = [
      `$ sudo eggs produce \nproduce an ISO called [hostname]-[arch]-YYYY-MM-DD_HHMM.iso, compressed xz (standard compression).\nIf hostname=ugo and arch=i386 ugo-x86-2020-08-25_1215.iso\n`,
      `$ sudo eggs produce -v\nthe same as the previuos, but with more explicative output\n`,
      `$ sudo eggs produce -vf\nthe same as the previuos, compression lz4 (fastest but about 30%\nless compressed than xz)\n`,
      `$ sudo eggs produce -vm\nthe same as the previuos, compression xz (normal compression xz)\n`,
      `$ sudo eggs produce -vm\nthe same as the previuos, compression xz -Xbcj x86 (max compression, about 10%\nmore compressed)\n`,
      `$ sudo eggs produce -vf --basename leo --theme debian --adapt \nproduce an ISO called leo-i386-2020-08-25_1215.iso compression lz4,\nusing Debian theme and link to adapt\n`,
      `$ sudo eggs produce -v --basename leo --theme debian --adapt \nproduce an ISO called leo-i386-2020-08-25_1215.iso compression xz,\nusing Debian theme and link to adapt\n`,
      `$ sudo eggs produce -v --basename leo --rsupport \nproduce an ISO called leo-i386-2020-08-25_1215.iso compression xz, using eggs\ntheme and link to dwagent\n`,
      `$ sudo eggs produce -vs --basename leo --rsupport \nproduce scripts to build an ISO as the previus example. Scripts can be found\nin /home/eggs/ovarium and you can customize all you need\n` 
   ]

   async run() {
      Utils.titles(this.id + ' ' + this.argv)
      const { flags } = this.parse(Produce)
      if (Utils.isRoot(this.id)) {
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

         let prefix = ''
         if (flags.prefix !== undefined) {
            prefix = flags.prefix
         }

         let basename = '' // se vuoto viene definito da loadsetting (default nome dell'host)
         if (flags.basename !== undefined) {
            basename = flags.basename
         }

         let compression = '' // se vuota, compression viene definita da loadsettings, default xz
         if (flags.fast) {
            compression = 'lz4'
         } else if (flags.normal) {
            compression = 'xz'
         } else if (flags.max) {
            compression = 'xz -Xbcj x86'
         }

         const verbose = flags.verbose

         const script = flags.script

         const yolk = flags.yolk

         const final = flags.final


         let theme = 'eggs'
         if (flags.theme !== undefined) {
            theme = flags.theme
         }

         const myAddons = {} as IMyAddons
         myAddons.adapt = flags.adapt
         myAddons.rsupport = flags.rsupport
         myAddons.ichoice = flags.ichoice
         myAddons.pve = flags.pve

         const i = await Prerequisites.thatWeNeed(verbose)
         if (i.clean || i.configuration || i.links) {
            if (await Utils.customConfirm(`Select yes to continue...`)) {
               await Prerequisites.install(i, verbose)
            }
         }
         Utils.titles(this.id + ' ' + this.argv)

         const ovary = new Ovary(prefix, basename, theme, compression)
         Utils.warning('Produce an egg...')
         if (await ovary.fertilization()) {

            await ovary.produce(basename, script, yolk, final, theme, myAddons, verbose)
            ovary.finished(script)
         }
      }
   }
}

