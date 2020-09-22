/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import Utils from '../classes/utils'
import Settings from '../classes/settings'
import Incubator from '../classes/incubation/incubator'
import Pacman from '../classes/pacman'
import { IRemix } from '../interfaces'

export default class Calamares extends Command {
   static description = 'configure calamares or install and configure it'

   remix = {} as IRemix

   incubator = {} as Incubator

   settings = {} as Settings

   static flags = {
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v' }),
      configuration: flags.boolean({ char: 'c', description: 'creation of configuration files only' }),
      sterilize: flags.boolean({description: 'sterilize: remove eggs prerequisites, calamares and all it\'s dependencies' }),
      theme: flags.string({ description: 'theme/branding for eggs and calamares' })
   }

   static examples = [`~$ sudo eggs calamares \ninstall calamares and create configuration\n`, `~$ sudo eggs calamares -c \ncreate/renew calamares configuration files\n`]

   async run() {
      Utils.titles('calamares')

      const { flags } = this.parse(Calamares)
      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      let install = false
      if (!flags.configuration) {
         install = true
      }

      let sterilize = false
      if (flags.sterilize) {
         sterilize = true
      }

      let theme = 'eggs'
      if (flags.theme !== undefined) {
         theme = flags.theme
      }
      console.log(`theme: ${theme}`)

      if (Utils.isRoot()) {
         if (Pacman.isXInstalled()) {
            if (await Utils.customConfirm(`Select yes to continue...`)) {
               if (install) {
                  Utils.warning('Installing calamares prerequisites...')
                  await Pacman.prerequisitesCalamaresInstall()
               }

               Utils.warning('Configuring calamares...')
               this.settings = new Settings()
               if (await this.settings.load()) {
                  await this.settings.loadRemix(this.settings.snapshot_basename, theme)
                  this.incubator = new Incubator(this.settings.remix, this.settings.distro, this.settings.user_opt, verbose)
                  await this.incubator.config(sterilize)
               }
            }
         } else {
            console.log(`You cannot use calamares installer without X system!`)
         }
      }
   }
}
