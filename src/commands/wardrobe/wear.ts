import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import Utils from '../../classes/utils'
import path from 'path'
import Tailor from '../../classes/tailor'

export default class Wear extends Command {
  static description = 'wear costume'

  static flags = {
    costume: Flags.string({ char: 'c', description: 'Costume' }),
    wardrobe: Flags.string({ char: 'w', description: 'wardrobe' }),
    verbose: Flags.boolean({ char: 'v' }),
    help: Flags.help({ char: 'h' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Wear)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }
    const echo = Utils.setEcho(verbose)

    Utils.titles(this.id + ' ' + this.argv)

    let wardrobe = `${path.resolve(__dirname, '../../../wardrobe.d')}`
    if (flags.gardrobe != undefined) {
      wardrobe = flags.wardrobe
    }

    let costume = 'xfce4'
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

