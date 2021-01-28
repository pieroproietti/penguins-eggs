/**
 * penguins-eggs-v7
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
import fs = require('fs')
import path = require('path')

const exec = require('../lib/utils').exec

/**
 * 
 */
export default class Prerequisites extends Command {
   static description = 'install packages prerequisites to run eggs'

   static aliases = ['start', 'configure']
   static flags = {
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' }),
   }

   static examples = [`~$ eggs prerequisites\ninstall prerequisites and create configuration files\n`,
      'sudo eggs prerequisites -c\n create configuration\'s file']

   async run() {
      Utils.titles(this.id + ' ' + this.argv)

      const { flags } = this.parse(Prerequisites)

      const verbose = flags.verbose

      if (Utils.isRoot()) {
         // Aggiungere autocomplete

         // Man
         this.man(verbose)

         if (!Pacman.configurationCheck()) {
            await Pacman.configurationInstall()
         }
         // crea i link in /usr/lib/penguins-eggs/conf/distros
         await Pacman.copyDistroTemplate(verbose)

         const i = await Prerequisites.thatWeNeed(verbose)
         if (i.clean || i.configuration || i.links) {
            if (await Utils.customConfirm(`Select yes to continue...`)) {
               console.log('installing prerequisites...')
               await Prerequisites.install(i, verbose)
               await Pacman.configurationInstall(verbose)
            }
         } else {
            console.log('prerequisites: all is OK, nothing to do!')
         }
      }
   }

   /**
    * Installa manuale
    */
   man(verbose = false) {
      const man1Dir = '/usr/local/man/man1'
      const man1eggs = '/usr/local/man/man1/eggs.1'
      if (fs.existsSync(man1eggs)) {
         exec(`rm ${man1eggs}`)
      }
      if (!fs.existsSync(man1Dir)) {
         exec(`mkdir ${man1Dir} -p`)
      }
      const manPage = path.resolve(__dirname, '../../man/man1/eggs.1')
      exec(`cp ${manPage} ${man1Dir}`)
      if (verbose) {
         exec(`mandb`)
      } else {
         exec(`mandb > /dev/null`)
      }
      console.log('man eggs installed')
   }

   /**
    * 
    * @param links
    * @param verbose 
    */
   static async thatWeNeed(verbose = false): Promise<IInstall> {
      const i = {} as IInstall

      i.links = !Pacman.linksCheck()

      if (process.arch === 'x64') {
         i.efi = (!Pacman.packageIsInstalled('grub-efi-amd64'))
      }

      if (! await Pacman.calamaresCheck() && (Pacman.isXInstalled())) {
         Utils.warning('You are on a graphics system, I suggest to use the GUI installer calamares')
         i.calamares = (await Utils.customConfirm('Want to install calamares?'))
         console.log()
      }

      i.configuration = !Pacman.configurationCheck()

      i.prerequisites = !await Pacman.prerequisitesCheck()

      if (i.efi || i.calamares || i.prerequisites) {
         i.clean = true
      }

      if (i.clean || i.configuration || i.links) {
         Utils.warning(`Eggs will execute the following tasks:`)

         if (i.clean) {
            console.log('- udpate the system')
            console.log(chalk.yellow('  apt update --yes\n'))
         }

         if (i.efi) {
            console.log('- install efi packages')
            console.log(chalk.yellow('  apt install -y grub-efi-amd64\n'))
         }

         if (i.prerequisites) {
            console.log('- install prerequisites')
            console.log(chalk.yellow('  apt install --yes ' + Pacman.debs2line(Pacman.debs4notRemove)))

            const packages = Pacman.packages(verbose)
            console.log(chalk.yellow('  apt install --yes ' + Pacman.debs2line(packages)))

            if (i.configuration) {
               Utils.warning('creating configuration\'s files...')
               Pacman.configurationInstall(verbose)
            }

            if (i.links) {
               console.log('- create links to different distros\n')
            }

            const packagesLocalisation = Pacman.packagesLocalisation()
            if (packagesLocalisation.length > 0) {
               console.log(chalk.yellow('  apt install --yes --no-install-recommends live-task-localisation ' + Pacman.debs2line(packagesLocalisation)) + '\n')
            } else {
               console.log()
            }
         }

         if (i.calamares) {
            console.log('- install calamares')
            const packages = await Pacman.debs4calamares
            console.log(chalk.yellow('  apt install -y ' + Pacman.debs2line(packages) + '\n'))
         }

         if (i.clean) {
            console.log('- cleaning apt\n')
         }

         if (i.configuration || i.clean) {
            console.log('- creating/updating configuration')
            console.log('  files: ' + chalk.yellow('/etc/penguins-eggs.d/eggs.yaml') + ' and ' + chalk.yellow('/usr/local/share/penguins-eggs/exclude.list\n'))
         }

         if (i.clean) {
            Utils.warning('Be sure! It\'s just a series of apt install from your repositories. You can follows them using flag --verbose')
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
      const echo = Utils.setEcho(verbose)

      if (i.configuration) {
         await Pacman.configurationInstall(verbose)
      }

      if (i.links) {
         await Pacman.copyDistroTemplate(verbose)
      }

      if (i.clean) {
         Utils.warning('apt-get update --yes')
         await exec('apt-get update --yes', echo)
      }

      if (i.efi) {
         Utils.warning('Installing uefi support...')
         await Pacman.packageInstall('grub-efi-amd64')
      }

      if (i.prerequisites) {
         Utils.warning('Installing prerequisites...')
         await Pacman.prerequisitesInstall(verbose)
      }

      if (i.calamares) {
         Utils.warning('Installing calamares...')
         await Pacman.calamaresInstall(verbose)
      }

      if (i.clean) {
         Utils.warning('cleaning the system...')
         const bleach = new Bleach()
         await bleach.clean(verbose)
      }

      if (i.configuration) {
         await Pacman.configurationInstall(verbose)
      }
   }
}