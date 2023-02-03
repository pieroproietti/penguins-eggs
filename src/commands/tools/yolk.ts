/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'
import shx from 'shelljs'
import fs from 'node:fs'
import Utils from '../../classes/utils'
import Yolk from '../../classes/yolk'

/**
 *
 */
export default class DevYolk extends Command {
  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v' })
  }
  static description = 'configure eggs to install without internet'
  static examples = [
    "sudo eggs yolk"
    ]


  static dir = '/var/local/yolk'

  /**
   *
   */
  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(DevYolk)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    if (Utils.isRoot()) {
      if (fs.existsSync(DevYolk.dir)) {
        shx.exec(`rm ${DevYolk.dir} -rf `)
      }

      const yolk = new Yolk()
      await yolk.create(verbose)
    } else {
      Utils.useRoot(this.id)
    }
  }
}
