/**
 * penguins-eggs-v8
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, Flags} from '@oclif/core'
import chalk from 'chalk'
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'
import Bleach from '../classes/bleach'
import {IInstall} from '../interfaces/index'
import {array2spaced} from '../lib/dependencies'

import {exec} from '../lib/utils'

/**
 *
 */
export default class Config extends Command {
  static flags = {
    clean: Flags.boolean({char: 'c', description: 'remove old configuration before to create new one'}),
    help: Flags.help({char: 'h'}),
    nointeractive: Flags.boolean({char: 'n', description: 'no user interaction'}),
    verbose: Flags.boolean({char: 'v', description: 'verbose'}),
  }

  static description = 'Configure and install prerequisites deb packages to run it'
  static examples = [
    'sudo eggs config',
    'sudo eggs config --clean',
    'sudo eggs config --clean --nointeractive',
  ]

  async run(): Promise<void> {
    const {flags} = await this.parse(Config)
    const nointeractive = flags.nointeractive
    const verbose = flags.verbose

    if (!nointeractive) {
      Utils.titles(this.id + ' ' + this.argv)
      if (Utils.isDebPackage()) {
        Utils.warning('running as package .deb')
      } else if (Utils.isSources()) {
        Utils.warning('running as sources')
      }
    }

    if (Utils.isRoot(this.id)) {
      if (flags.clean) {
        Utils.warning('removing old configurations')
        await exec('rm /etc/penguins-eggs.d -rf')
      }

      /**
       * Se stiamo utilizzando eggs da sorgenti
       * Aggiungo autocomplete e manPage
       */
      if (Utils.isSources()) {
        Utils.warning('creating autocomplete...')
        await Pacman.autocompleteInstall(verbose)
        Utils.warning('creating eggs man page...')
        await Pacman.manPageInstall(verbose)
      }

      // Vediamo che cosa c'è da fare...
      Utils.warning('what we need?')
      const i = await Config.thatWeNeed(nointeractive, verbose)
      if (i.needApt || i.configurationInstall || i.configurationRefresh || i.distroTemplate) {
        if (nointeractive) {
          await Config.install(i, nointeractive, verbose)
        } else if (await Utils.customConfirm()) {
          await Config.install(i, nointeractive, verbose)
        }
      }
    } else {
      Utils.useRoot(this.id)
    }
  }

  /**
   *
   *
   * @param verbose
   */
  static async thatWeNeed(nointeractive = false, verbose = false, cryptedclone = false): Promise<IInstall> {
    const i = {} as IInstall

    i.distroTemplate = !Pacman.distroTemplateCheck()

    if (Utils.machineArch() !== 'i386') {
      i.efi = !Pacman.isUefi()
    }

    if (!cryptedclone && !(await Pacman.calamaresCheck()) && Pacman.isInstalledGui() && Pacman.isCalamaresAvailable() && !Pacman.packageIsInstalled('live-installer')) {
      Utils.warning('Config: you are on a graphic system, I suggest to install the GUI installer calamares')
      // se nointeractive i.calamares=false
      i.calamares = nointeractive ? false : await Utils.customConfirm('Want You install calamares?')
    }

    i.configurationInstall = !Pacman.configurationCheck()
    if (!i.configurationInstall) {
      i.configurationRefresh = !Pacman.configurationMachineNew()
    }

    i.prerequisites = !(await Pacman.prerequisitesCheck())

    if (i.efi || i.calamares || i.prerequisites) {
      i.needApt = true
    }

    /**
     * Visualizza cosa c'è da fare
     */
    if (!nointeractive) {
      if (i.needApt) {
        console.log('- update the system')
        if (Pacman.distro().familyId === 'debian') {
          console.log(chalk.yellow('  apt-get update --yes\n'))
        }
      }

      if (i.efi && Pacman.distro().familyId === 'debian' && Utils.machineArch() !== 'i386') {
        console.log('- install efi packages')
        console.log(chalk.yellow('  apt install -y grub-efi-' + Utils.machineArch() + '-bin\n'))
      }

      if (i.prerequisites) {
        console.log('- install packages prerequisites')
        const packages = Pacman.packages(verbose)

        if (packages.length > 0) {
          console.log(chalk.yellow('  will install: ' + array2spaced(packages)))
        }
      }

      if (i.configurationInstall) {
        console.log("- creating configuration's files...")
        Pacman.configurationInstall(verbose)
      }

      if (i.configurationRefresh) {
        console.log("- refreshing configuration's files...")
        Pacman.configurationFresh()
      }

      if (i.distroTemplate) {
        console.log('- copy distro template\n')
      }

      if (i.calamares) {
        console.log('- install calamares')
        if (Pacman.distro().familyId === 'debian') {
          const packages = Pacman.debs4calamares
          console.log(chalk.yellow('  will install: ' + array2spaced(packages) + '\n'))
        }
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
        Utils.warning("Be sure! It's just a series of apt install from your repo.\nYou can follows them using flag --verbose")
      }
    }

    return i
  }

  /**
   *
   * @param i
   * @param verbose
   */
  static async install(i: IInstall, nointeractive = false, verbose = false) {
    const echo = Utils.setEcho(verbose)

    Utils.warning('config: so, we install')

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

    if (i.needApt && !nointeractive && !nointeractive && Pacman.distro().familyId === 'debian') {
      Utils.warning('updating system...')
      await exec('apt-get update --yes', echo)
    }

    if (i.efi) {
      if (nointeractive) {
        Utils.error('config: you are on a system UEFI')
        Utils.warning('I suggest You to install grub-efi-' + Utils.machineArch() + '-bin before to produce your ISO.\nJust write:\n    sudo apt install grub-efi-' + Utils.machineArch())
      } else if (Pacman.distro().familyId === 'debian') {
        Utils.warning('Installing uefi support...')
        await exec('apt-get install grub-efi-' + Utils.machineArch() + '-bin --yes', echo)
      }
    }

    if (i.prerequisites) {
      if (nointeractive) {
        Utils.warning("Can't install prerequisites now...")
      } else {
        await Pacman.prerequisitesInstall(verbose)
      }
    }

    if (i.calamares && Pacman.isCalamaresAvailable()) {
      if (nointeractive) {
        Utils.warning('I suggest You to install calamares GUI installer before to produce your ISO.\nJust write:\n    sudo eggs calamares --install')
      } else {
        Utils.warning('Installing calamares...')
        await Pacman.calamaresInstall(verbose)
        await Pacman.calamaresPolicies()
      }
    }

    if (i.needApt && !nointeractive) {
      Utils.warning('cleaning the system...')
      if (Pacman.distro().familyId === 'debian') {
        const bleach = new Bleach()
        await bleach.clean(verbose)
      }
    }
  }
}
