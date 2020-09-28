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
import chalk = require('chalk')

const exec = require('../lib/utils').exec

/**
 * 
 */
export default class Prerequisites extends Command {
   static description = 'install packages prerequisites to run eggs'

   static flags = {
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }

   static examples = [`~$ eggs prerequisites\ninstall prerequisites and create configuration files\n`]

   async run() {
      Utils.titles('prerequisites')

      const { flags } = this.parse(Prerequisites)
      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      if (Utils.isRoot()) {
         const i = await Prerequisites.thatWeNeed(verbose)
         if (i.clean || i.configuration || i.links){
            if (await Utils.customConfirm(`Select yes to continue...`)) {
               console.log('installing')
               await Prerequisites.install(i, verbose)
            }
         } else {
            console.log('All is OK, nothing to do!')
         }
      }
   }

   /**
    * 
    * @param links
    * @param verbose 
    */
   static async thatWeNeed(verbose = false): Promise<IInstall> {
      Utils.titles('prerequisites')

      console.log('eggs need same prerequisites to work. You can install them here')

      let i = {} as IInstall

      i.links = !Pacman.linksCheck()

      if (process.arch === 'x64') {
         i.efi = (!Pacman.packageIsInstalled('grub-efi-amd64'))
      }

      if (! await Pacman.calamaresCheck() && (Pacman.isXInstalled())) {
         Utils.warning('You are on a graphics system, I suggest to use the GUI installer calamares')
         i.calamares = (await Utils.customConfirm('Want to install calamares?'))
      }

      i.configuration = !Pacman.configurationCheck()

      i.prerequisites = !await Pacman.prerequisitesCheck()

      if (i.efi || i.calamares || i.prerequisites) {
         i.clean = true
      }

      if (i.clean || i.configuration || i.links) {
         Utils.warning(`Installing prerequisites.\nEggs will execute the following tasks:`)

         if (i.links) {
            console.log('- create links to different distros\n')
         }

         if (i.efi) {
            console.log('- install efi packages')
            console.log(chalk.yellow('  apt install -y grub-efi-amd64\n'))
         }

         if (i.calamares) {
            console.log('- install calamares')
            const packages = Pacman.debs4calamares
            console.log(chalk.yellow('  apt install -y ' + Pacman.debs2line(packages) + '\n'))
         }

         if (i.configuration) {
            console.log('- configuration\n')
         }

         if (i.prerequisites) {
            console.log('- install prerequisites')
            const packages = Pacman.packages()
            console.log(chalk.yellow('  apt install -y ' + Pacman.debs2line(packages)))
            if (i.configuration) {
               await Pacman.configurationInstall(false) // carico la configurazione solo per leggere le lingue
            }
            const packagesLocalisation = Pacman.packagesLocalisation()
            if (packagesLocalisation.length > 0) {
               console.log(chalk.yellow('  apt install --no-install-recommends  --yes live-task-localisation ' + Pacman.debs2line(packagesLocalisation)) + '\n')
            } else {
               console.log()
            }
         }
         if (i.clean) {
            console.log('- cleaning apt\n')
            Utils.warning('Don\'t be scared! I\'ll produce a lot of text, but it\'s just a series of apt install from you repositories!')
         }
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
         await Pacman.linksInstall(verbose)
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

