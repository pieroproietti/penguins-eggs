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
import { IRemix } from '../interfaces'

export default class Calamares extends Command {
   static description = 'configure calamares or install and configure it'

   remix = {} as IRemix

   static flags = {
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v' }),
      configuration: flags.boolean({ char: 'c', description: 'creation of configuration files only' }),
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

      // Nome del brand di calamares
      let branding = 'eggs'
      console.log(`theme: ${flags.theme}`)
      if (flags.theme !== undefined) {
         branding = flags.theme
         console.log(`calamares branding: ${branding}`)
      }

      console.log(`calamares: ${install}`)
      if (Utils.isRoot()) {
         if (Pacman.isXInstalled()) {
            console.log(`isXInstalled: true`)

            if (await Utils.customConfirm(`Select yes to continue...`)) {
               if (install) {
                  Utils.warning('Installing calamares prerequisites...')
                  await Pacman.prerequisitesCalamaresInstall()
               }

               // if (branding === '') {
               //   this.remix.branding = 'eggs'
               // } else {
               //   this.remix.branding = branding
               // }
               this.remix.branding = 'eggs'

               Utils.warning('Configuring calamares...')
               const ovary = new Ovary()
               if (await ovary.fertilization()) {
                  await ovary.calamaresConfigure(verbose)
               }
            }
         }
      }
   }
}
