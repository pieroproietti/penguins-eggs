/**
 * penguins-eggs
 * command: yolk.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, Flags} from '@oclif/core'
import shx from 'shelljs'
import fs from 'node:fs'
import Utils from '../../classes/utils'
import Yolk from '../../classes/yolk'

/**
 *
 */
export default class ToolsYolk extends Command {
  static flags = {
    help: Flags.help({char: 'h'}),
    verbose: Flags.boolean({char: 'v'}),
  }

  static description = 'configure eggs to install without internet'
  static examples = [
    'sudo eggs tools yolk',
  ]

  static dir = '/var/local/yolk'

  /**
   *
   */
  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const {flags} = await this.parse(ToolsYolk)

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
