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
import { IInstall } from '../interfaces'

const exec = require('../lib/utils').exec

/**
 * 
 */
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
         const i = await Prerequisites.thatWeNeed(links, verbose)
         if (await Utils.customConfirm(`Select yes to continue...`)) {
            console.log('installing')
            await Prerequisites.install(i, verbose)
         }
      }
   }

   /**
    * 
    * @param links 
    * @param verbose 
    */
   static async thatWeNeed(links = false, verbose = false): Promise<IInstall> {
      Utils.titles('prerequisites')

      console.log('eggs need same prerequisites to work. You can install them here')

      let i = {} as IInstall

      i.links = !Pacman.linksCheck() || links

      if (process.arch === 'x64') {
         i.efi = (!Pacman.packageIsInstalled('grub-efi-amd64'))
      }

      if (! await Pacman.calamaresCheck() && (Pacman.isXInstalled())) {
         Utils.warning('You are on a graphics system, I suggest to use the GUI installer calamares')
         i.calamares = (await Utils.customConfirm('Want to install calamares?'))
      }

      i.configuration = !Pacman.configurationCheck()
      console.log(`configuration: ${i.configuration}` )

      i.prerequisites = !Pacman.prerequisitesCheck()

      if (i.efi || i.calamares || i.prerequisites) {
         i.clean = true
      }

      if (i.clean || i.configuration || i.links) {
         Utils.warning(`Installing prerequisites.\nEggs will execute the following tasks:`)
         if (i.links) console.log('- create links to different distros')
         if (i.efi) console.log('- install efi packages')
         if (i.calamares) console.log('- install calamares')
         if (i.configuration) console.log('- configuration')
         if (i.prerequisites) console.log('- install prerequisites')
         if (i.clean) console.log('- cleaning apt')
         Utils.warning('Don\'t be scared! Just a series of apt commands from you repositories!')
      }
      return i
   }


   /**
    * 
    * @param links 
    * @param verbose 
    */
   static async install(i: IInstall, verbose = false) {
      verbose = true
      const echo = Utils.setEcho(verbose)

      await Pacman.configurationInstall(false)

      if (i.links) {
         await Pacman.linksInstall(i.links, verbose)
      }

      if (i.clean) {
         await exec('apt-get update --yes', echo)
      }

      if (i.efi) {
         Utils.warning('Installing uefi support...')
         await Pacman.packageInstall('grub-efi-amd64')
      }

      if (i.calamares) {
         Utils.warning('Installing calamares...')
         await Pacman.calamaresInstall()
      }

      if (i.configuration) {
         Utils.warning('creating configuration...')
         await Pacman.configurationInstall(verbose)
      }

      if (i.prerequisites) {
         Utils.warning('Installing prerequisites...')
         await Pacman.prerequisitesInstall(verbose)
      }

      if (i.clean) {
         const bleach = new Bleach()
         await bleach.clean(verbose)
      }
   }
}

