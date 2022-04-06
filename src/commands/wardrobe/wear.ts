import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import Utils from '../../classes/utils'
import os from 'os'
import Tailor from '../../classes/tailor'
// libraries
import { exec } from '../../lib/utils'


/**
 * 
 */
export default class Wear extends Command {
  static description = 'wear costume/accessories from wardrobe'

  static flags = {
    costume: Flags.string({ char: 'c', description: 'costume' }),
    wardrobe: Flags.string({ char: 'w', description: 'wardrobe' }),
    silent: Flags.boolean({ char: 's' }),
    help: Flags.help({ char: 'h' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Wear)

    let verbose = true
    if (flags.silent) {
      verbose = true
    }

    Utils.titles(this.id + ' ' + this.argv)

    let wardrobe = await Utils.wardrobe()
    if (flags.wardrobe != undefined) {
      wardrobe = flags.wardrobe
    }

    let costume = 'colibri'
    if (flags.costume !== undefined) {
      costume = flags.costume
    }

    if (Utils.isRoot() && (await Utils.customConfirm(`Prepare your costume: ${costume}? Select yes to continue...`))) {
      const tailor = new Tailor(wardrobe, costume)
      await tailor.prepare(verbose)
    } else {
      console.log('costume ' + chalk.cyan(costume) + ' not found in wardrobe: ' + chalk.green(wardrobe))
    }
  }
}

