/**
 * ./src/commands/tools/yolk.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import fs from 'node:fs'
import {shx} from '../../lib/utils.js'

import Utils from '../../classes/utils.js'
import Yolk from '../../classes/yolk.js'

/**
 *
 */
export default class ToolsYolk extends Command {
  static description = 'configure eggs to install without internet'

  static dir = '/var/local/yolk'
  static examples = ['sudo eggs tools yolk']

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v' })
  }

  /**
   *
   */
  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(ToolsYolk)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    if (Utils.isRoot()) {
      if (fs.existsSync(ToolsYolk.dir)) {
        shx.exec(`rm ${ToolsYolk.dir} -rf `)
      }

      const yolk = new Yolk()
      await yolk.create(verbose)
    } else {
      Utils.useRoot(this.id)
    }
  }
}
