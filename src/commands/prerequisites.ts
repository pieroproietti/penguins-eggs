/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'
import Bleach from '../classes/bleach'

export default class Prerequisites extends Command {
   static description = 'install packages prerequisites to run eggs'

   static flags = {
      help: flags.help({ char: 'h' }),
      configuration_only: flags.boolean({ char: 'c', description: 'creation of configuration files only' }),
      links: flags.boolean({ char: 'l', description: 'creation of links' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }

   static examples = [`~$ eggs prerequisites\ninstall prerequisites and create configuration files\n`, `~$ eggs prerequisites -c\nonly create configuration files\n`]

   async run() {
      Utils.titles('prerequisites')

      const { flags } = this.parse(Prerequisites)
      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      let links = false
      if (flags.links) {
         links = true
      }


      if (Utils.isRoot()) {
         if (await Utils.customConfirm(`Select yes to continue...`)) {
            await Prerequisites.installAll(links, verbose)
         }
      }
   }

   /**
    * 
    * @param links 
    * @param verbose 
    */
   static async installAll(links = false, verbose = false) {
      // Creo la configurazione, sarà ricreata successivamente
      // await Pacman.configurationInstall(false)

      // await Pacman.linksInstall(verbose)


      if (process.arch === 'x64') {
         if (!Pacman.packageIsInstalled('grub-efi-amd64')) {
            await Pacman.packageInstall('grub-efi-amd64')
            Utils.warning('Installing uefi support...')
         } else {
            Utils.warning('uefi support installed!')
         }
      }

      let clean = false
      if (! await Pacman.calamaresCheck() && (Pacman.isXInstalled())) {
         clean = true
         Pacman.calamaresInstall()
      } else {
         Utils.warning('calamares installed!')
      }

      if (!Pacman.prerequisitesCheck()) {
         clean = true
         Utils.warning('Installing prerequisites...')
         await Pacman.prerequisitesInstall(verbose)
      } else {
         Utils.warning('prerequisites installed!')
      }

      if (!Pacman.configurationCheck()) {
         Utils.warning('creating configuration...')
         await Pacman.configurationInstall(verbose)
      } else {
         Utils.warning('configuration created!')
      }

      if (clean) {
         const bleach = new Bleach()
         await bleach.clean(verbose)
      }

   }
}

