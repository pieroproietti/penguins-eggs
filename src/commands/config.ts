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
export default class Config extends Command {
   static description = 'Configure eggs and install packages prerequisites to run it'

   static aliases = ['prerequisites']
   static flags = {
      yes: flags.boolean({ char: 'y', description: 'assume yes' }),
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' }),
   }

   static examples = [`~$ sudo eggs config\nConfigure eggs and install prerequisites`]

   async run() {
      const { flags } = this.parse(Config)
      const yes = flags.yes
      const verbose = flags.verbose

      if (!yes) {
         Utils.titles(this.id + ' ' + this.argv)
      }

      if (Utils.isRoot(this.id)) {
         /**
          * Se siamo in un pacchetto npm
          * Aggiunge autocomplete e manPage
          */
         if (!Utils.isNpmPackage()) {
            await Pacman.autocompleteInstall(verbose)
            await Pacman.manPageInstall(verbose)
         }

         // Vede che cosa c'è da fare...
         const i = await Config.thatWeNeed(yes, verbose)

         /**
          * ...e lo fa!
          */
         if (i.needApt || i.configurationInstall || i.configurationRefresh || i.distroTemplate) {
            if (yes) {
               await Config.install(i, verbose)
            } else {
               if (await Utils.customConfirm()) {
                  await Config.install(i, verbose)
               }
            }
         } else {
            Utils.warning('config: nothing to do!')
         }
      }
   }


   /**
    * 
    * 
    * @param verbose 
    */
   static async thatWeNeed(yes = false, verbose = false): Promise<IInstall> {
      let i = {} as IInstall

      i.distroTemplate = !Pacman.distroTemplateCheck()

      if (process.arch === 'x64') {
         i.efi = (!Pacman.packageIsInstalled('grub-efi-amd64'))
      }

      if (! await Pacman.calamaresCheck() && (await Pacman.isGui())) {
         Utils.warning('config: you are on a graphics system, I suggest to use the GUI installer calamares')
         i.calamares = (await Utils.customConfirm('Want to install calamares?'))
      }

      i.configurationInstall = !Pacman.configurationCheck()
      if (!i.configurationInstall) {
         i.configurationRefresh = !Pacman.configurationMachineNew()
      }

      i.prerequisites = !await Pacman.prerequisitesCheck()

      if (i.efi || i.calamares || i.prerequisites) {
         i.needApt = true
      }

      /**
       * Visualizza cosa c'è da fare
       */
      if (i.needApt || i.configurationInstall || i.configurationRefresh || i.distroTemplate || i.prerequisites) {
         Utils.warning('config: that we need...')
         if (i.needApt) {
            console.log('- update the system')
            console.log(chalk.yellow('  apt update --yes\n'))
         }

         if (i.efi) {
            if (process.arch === 'x32') {
               // do nothing
            } else if (process.arch === 'ia32') {
               // do nothing
            } else if (process.arch === 'x64') {
               console.log('- install efi packages')
               console.log(chalk.yellow('  apt install -y grub-efi-amd64\n'))
            }
         }

         if (i.prerequisites) {
            console.log('- install prerequisites')
            console.log(chalk.yellow('  apt install --yes ' + Pacman.debs2line(Pacman.debs4notRemove)))

            const packages = Pacman.packages(verbose)
            console.log(chalk.yellow('  apt install --yes ' + Pacman.debs2line(packages)))

            if (i.configurationInstall) {
               console.log('- creating configuration\'s files...')
               Pacman.configurationInstall(verbose)
            }

            if (i.configurationRefresh) {
               console.log('- refreshing configuration\'s files...')
               Pacman.configurationFresh()
            }

            if (i.distroTemplate) {
               console.log('- copy distro template\n')
            }

            const packagesLocalisation = Pacman.packagesLocalisation()
            if (packagesLocalisation.length > 0) {
               console.log('- localisation')
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

         if (i.needApt) {
            console.log('- cleaning apt\n')
         }

         if (i.configurationInstall) {
            console.log('- creating/updating configuration')
            console.log('  files: ' + chalk.yellow('/etc/penguins-eggs.d/eggs.yaml') + ' and ' + chalk.yellow('/usr/local/share/penguins-eggs/exclude.list\n'))
         } else if (i.configurationRefresh) {
            console.log('- refreshing configuration for new machine')
         }

         if (i.needApt) {
            Utils.warning('Be sure! It\'s just a series of apt install from your repo.\nYou can follows them using flag --verbose')
         }
      }
      return i
   }


   /**
    * 
    * @param i
    * @param verbose 
    */
   static async install(i: IInstall, verbose = false) {
      const echo = Utils.setEcho(verbose)

      Utils.warning('config: install')

      if (i.configurationInstall) {
         Utils.warning('creating configuration...')
         await Pacman.configurationInstall(verbose)
      }

      if (i.configurationRefresh) {
         Utils.warning('refreshing configuration for new machine...')
         await Pacman.configurationMachineNew(verbose)
      }


      if (i.distroTemplate) {
         Utils.warning('coping distro templates...')
         await Pacman.distroTemplateInstall(verbose)
      }

      if (i.needApt) {
         Utils.warning('updating system...')
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

      if (i.needApt || i.calamares) {
         Utils.warning('cleaning the system...')
         const bleach = new Bleach()
         await bleach.clean(verbose)
      }

   }
}