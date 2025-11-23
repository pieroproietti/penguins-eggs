/**
 * ./src/commands/setup.ts
 * penguins-eggs v.25.11.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs'
import Distro from '../classes/distro.js'
import Utils from '../classes/utils.js'
import Pacman from '../classes/pacman.js'
import { Command, Flags } from '@oclif/core'
import { DependencyManager } from '../appimage/dependency-manager.js'


export default class Setup extends Command {
  static description = 'Automatically check and install system prerequisites'

  static flags = {
    install: Flags.boolean({ char: 'r', description: 'install native dependencies, autocomplete, man, etc-' }),
    uninstall: Flags.boolean({ char: 'r', description: 'purge all configurations, autocomplete, man, etc installed from penguins-eggs AppImage' }),
  }

  static examples = [
    'eggs setup                           # this help' ,
    'sudo eggs setup --install            # install native dependencies, autocomplete, man, etc',
    'sudo eggs setup --uninstall          # purge all configurations, autocomplete, man, etc installed from penguins-eggs AppImage',
  ]

  /**
   * 
   * @returns 
   */
  public async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    /**
     * continue only on AppImage
     */
    if (!Utils.isAppImage()) {
      console.log("The eggs setup command is only applicable on the AppImage version.")
      process.exit()
    }

    const appImagePath = process.env.APPIMAGE;
    console.log(`Running AppImage:\n${appImagePath}\n`)

    const distro = new Distro()

    const osInfo = Utils.getOsRelease()
    const codenameId = osInfo.VERSION_CODENAME
    const releaseId = osInfo.VERSION_ID
    const distroId = osInfo.ID

    const { flags } = await this.parse(Setup)
    const depsManager = new DependencyManager()

    console.log(`Your system is: ${distroId} ${releaseId} ${codenameId}, family ${distro.familyId}\n`)
    console.log(`Compatible with: ${distro.distroLike} ${distro.distroUniqueId}\n`)

    if (depsManager.isInstalled()) {
      console.log('penguins-eggs distro meta-packages are already installed')
    } else {
      console.log('penguins-eggs distro meta-packages are NOT installed')
    }

    if (!Utils.isRoot()) {
      console.log('\nUse:')
      Setup.examples.forEach(element => {
        console.log(element)
      });

    } else {
      if (flags.install) {
        console.log()
        Utils.warning(`Are you sure you want to install penguins-eggs AppImage autocomplete, manpages, configurations and distro meta-packages:\n`)
        if (await Utils.customConfirm('Select yes to continue...')) {
          await Pacman.autocompleteInstall()
          await Pacman.manpageInstall()
          await Pacman.configurationInstall()
          depsManager.installDistroPackages()
        }
      } else if (flags.uninstall) {
        console.log()
        Utils.warning(`Are you sure you want to remove penguins-eggs AppImage autocomplete, manpages, configurations and distro meta-aackages:\n ${appImagePath}`)
        if (await Utils.customConfirm('Select yes to continue...')) {
          depsManager.removeDistroPackages()
          await Pacman.autocompleteRemove()
          await Pacman.manpageRemove()
          await Pacman.configurationRemove()

          console.log('penguins-eggs AppImage stuffs was successfully removed.\n');
          console.log('To remove AppImage file, use:');
          console.log(`rm ${appImagePath}\n`)
        }
      }
    }
  }

}

