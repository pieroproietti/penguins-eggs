/**
 * ./src/commands/config.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'

import Bleach from '../classes/bleach.js'
import Pacman from '../classes/pacman.js'
import Utils from '../classes/utils.js'
import { IInstall } from '../interfaces/index.js'
import { exec } from '../lib/utils.js'

/**
 *
 */
export default class Config extends Command {
  static description = 'Configure eggs to run it'

  static examples = ['sudo eggs config', 'sudo eggs config --clean', 'sudo eggs config --clean --nointeractive']

  static flags = {
    clean: Flags.boolean({ char: 'c', description: 'remove old configuration before to create new one' }),
    help: Flags.help({ char: 'h' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  /**
   *
   * @param i
   * @param verbose
   */
  static async install(i: IInstall, nointeractive = false, verbose = false) {
    const echo = Utils.setEcho(verbose)

    Utils.warning("sudo eggs config")

    if (i.configurationInstall) {
      Utils.warning('- creating configuration...')
      await Pacman.configurationInstall(verbose)
    }

    if (i.configurationRefresh) {
      Utils.warning('- refreshing configuration for new machine...')
      await Pacman.configurationMachineNew(verbose)
    }

    if (i.distroTemplate) {
      Utils.warning('- copying distro templates...')
      await Pacman.distroTemplateInstall(verbose)
    }

    if (i.needUpdate && !nointeractive && Pacman.distro().familyId === 'debian') {
      Utils.warning('- updating system...')
      await exec('apt-get update --yes', echo)
    }

    if (i.calamares) {
      let message = "- You are on a graphic system, is suggested\n"
      message    +="           to install the GUI installer calamares.\n"
      message    +='           just type: "sudo eggs calamares --install"'
      Utils.warning(message)
    }


    if (i.addEfi && Pacman.distro().familyId === 'debian') {
      Utils.warning('- installing UEFI support')
      await exec('apt-get install grub-efi-' + Utils.uefiArch() + '-bin --yes', echo)
    }

    if (i.needUpdate && !nointeractive) {
      Utils.warning('cleaning the system...')
      if (Pacman.distro().familyId === 'debian') {
        const bleach = new Bleach()
        await bleach.clean(verbose)
      }
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

    i.addEfi = !Pacman.isUefi()
    i.calamares=false
    if (!cryptedclone && 
        !Pacman.calamaresExists() && 
        Pacman.isInstalledGui() && 
        Pacman.isCalamaresAvailable()) {

      i.calamares = true
    }

    i.configurationInstall = !Pacman.configurationCheck()
    if (!i.configurationInstall) {
      i.configurationRefresh = !Pacman.configurationMachineNew()
    }

    return i
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Config)
    const { nointeractive } = flags
    const { verbose } = flags

    if (!nointeractive) {
      Utils.titles(this.id + ' ' + this.argv)
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

      const i = await Config.thatWeNeed(nointeractive, verbose)
      if (i.needUpdate || i.configurationInstall || i.configurationRefresh || i.distroTemplate) {
        await Config.install(i, nointeractive, verbose)
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
