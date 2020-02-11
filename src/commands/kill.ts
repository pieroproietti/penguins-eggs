/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command} from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'

export default class Kill extends Command {
  static description = 'kill the eggs/free the nest'

  static aliases = ['clean']

  static examples = [
    `$ eggs kill
kill the eggs/free the nest
`,
  ]

  async run() {
    if (Utils.isRoot()) {
      this.log(`${Utils.getFriendName()}: deleting old eggs...`)
      shx.exec('installed-to-live cleanup')
      shx.exec('rm /home/snapshot/ -rf')
    }
  }
}
