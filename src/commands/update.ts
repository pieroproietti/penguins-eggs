/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'

export default class Update extends Command {
   static description =
      "update/upgrade the penguin's eggs tool.\nThis way of update work only with npm installation, if you used the debian package version, please download the new one and install it."

   static examples = [
      `$ eggs update
update/upgrade the penguin's eggs tool
`
   ]

   async run() {
      Utils.titles('update')

      if (Utils.isRoot()) {
         if (await Utils.customConfirm(`Select yes to continue...`)) {
            Utils.warning('Updating eggs...')
            console.log(
               `updating ${Utils.getPackageName()} version ${Utils.getPackageVersion()}`
            )
            shx.exec(`npm update ${Utils.getPackageName()} -g`)
         }
      }
   }
}
