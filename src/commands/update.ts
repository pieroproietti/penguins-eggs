/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'

export default class Update extends Command {
  static description = 'update/upgrade the penguin\'s eggs tool'

  static examples = [
    `$ eggs update
update/upgrade the penguin's eggs tool
`,
  ]

  async run() {
    Utils.titles()
    if (Utils.isRoot()) {
      this.log(`updating ${Utils.getPackageName()} version ${Utils.getPackageVersion()}`)
      shx.exec(`npm update ${Utils.getPackageName()} -g`)
      shx.exit(0)
    }

  }
}
