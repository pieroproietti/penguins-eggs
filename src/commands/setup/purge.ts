/**
 * ./src/commands/setup.ts
 * penguins-eggs v.25.11.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import fs from 'fs'

import { DependencyManager } from '../../appimage/dependency-manager.js'
import Distro from '../../classes/distro.js'
import Pacman from '../../classes/pacman.js'
import Utils from '../../classes/utils.js'
import { execSync } from '../../lib/utils.js'

export default class Purge extends Command {
  static description = 'Automatically check and install system prerequisites'
static examples = [
    'eggs setup                           # this help',
    'sudo eggs setup install              # install native dependencies, autocomplete, man, etc',
    'sudo eggs setup purge                # purge all configurations, autocomplete, man, etc installed from penguins-eggs AppImage',
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
      console.log("The eggs setup purge command is only applicable on the AppImage version.")
      console.log("On penguins-eggs native package this operation is done by the system package manager.")
      process.exit()
    }

    const appImagePath = process.env.APPIMAGE;
    console.log(`Running AppImage:\n${appImagePath}\n`)
    const distro = new Distro()
    const osInfo = Utils.getOsRelease()
    const codenameId = osInfo.VERSION_CODENAME
    const releaseId = osInfo.VERSION_ID
    const distroId = osInfo.ID

    const { flags } = await this.parse(Purge)
    const depsManager = new DependencyManager()

    console.log(`Your system is: ${distroId} ${releaseId} ${codenameId}, family ${distro.familyId}\n`)
    console.log(`Compatible with: ${distro.distroLike} ${distro.distroUniqueId}\n`)


    if (Utils.isRoot()) {
      console.log()
      Utils.warning(`Are you sure you want to purge penguins-eggs AppImage autocomplete, manpages, configurations and distro meta-aackages:\n ${appImagePath}`)
      if (await Utils.customConfirm('Select yes to continue...')) {
        depsManager.removeDistroPackages()
        await Pacman.autocompleteRemove()
        await Pacman.manpageRemove()
        await Pacman.configurationRemove()
        execSync('rm -f /usr/share/applications/penguins-eggs.desktop')
        execSync('rm -f /usr/bin/penguins-links-add.sh')
        execSync('rm -f /usr/local/bin/g4*')

        console.log('penguins-eggs AppImage stuffs was successfully removed.\n');
        if (appImagePath === '/usr/bin/eggs') {
          execSync(`rm -f ${appImagePath} /usr/bin/eggs`)
        } else {
          console.log('You can completely erase AppImage file, using:');
          console.log(`sudo rm ${appImagePath}\n`)
        }

      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
