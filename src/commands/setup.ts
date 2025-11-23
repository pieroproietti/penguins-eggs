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
    install: Flags.boolean({ char: 'i', description: 'force installation even if already installed' }),
    uninstall: Flags.boolean({ char: 'u', description: 'uninstall penguins-eggs.AppImage' }),
  }

  static examples = [
    'sudo eggs setup                      # install native dependencies, autocomplete, man',
    'sudo eggs setup --install            # reinstall native dependencies',
    'sudo eggs setup --uninstall          # remove AppImage, purge configurations files, autocomplete, man',
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


    const distro = new Distro()

    const osInfo = Utils.getOsRelease()
    const codenameId = osInfo.VERSION_CODENAME
    const releaseId = osInfo.VERSION_ID
    const distroId = osInfo.ID

    console.log(`Running on: ${distroId} ${releaseId} ${codenameId} family: ${distro.familyId}`)
    console.log(`Compatible with:     ${distro.distroLike} ${distro.distroUniqueId}`)

    const { flags } = await this.parse(Setup)
    const depsManager = new DependencyManager()

    if (Utils.isRoot()) {

      if (flags.install) {
        await Pacman.autocompleteInstall()
        await Pacman.manpageInstall()
        // await Pacman.configurationInstall()

        // install^reinstall
        if (flags.install) {
          depsManager.reinstallDrivers()
        } else {
          depsManager.installDrivers()
        }
        


      } else if (flags.uninstall) {
        const appImagePath = process.env.APPIMAGE;
        console.log()
        Utils.warning(`Are you sure you want to delete penguins-eggs AppImage:\n ${appImagePath}`)
        if (await Utils.customConfirm('Select yes to continue...')) {
          await depsManager.removeDrivers()
          await Pacman.autocompleteRemove()
          await Pacman.manpageRemove()
          await Pacman.configurationRemove()
          await this.removeAppImage()
        }
      }

    } else {
      Utils.useRoot(this.id)
    }

  }

  /**
   * removeAppImage
   */
  async removeAppImage() {
    // APPIMAGE contiene il percorso del file .AppImage fisico
    const appImagePath = process.env.APPIMAGE;

    // Controllo di sicurezza: procediamo solo se siamo effettivamente in esecuzione come AppImage
    if (appImagePath && fs.existsSync(appImagePath)) {
      console.log(`Removing AppImage in progress: ${appImagePath}`);

      // Usa fs.unlink per rimuovere il file
      // Nota: Linux permette di cancellare un eseguibile mentre è in esecuzione.
      // Il processo continuerà fino alla chiusura, ma il file sparirà dal disco.
      await fs.promises.unlink(appImagePath);

      console.log('penguins-eggs AppImage successfully removed.');
    } else {
      console.log('Not running as AppImage or file does not exist, no action taken.');
    }
  }
}

