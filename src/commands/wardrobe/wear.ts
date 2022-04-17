import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import Utils from '../../classes/utils'
import path from 'path'
import fs from 'fs'
import Tailor from '../../classes/tailor'

// libraries
import { exec } from '../../lib/utils'


/**
 * 
 */
export default class Wear extends Command {
  static description = 'wear costume/accessories from wardrobe'

  static args = [{ name: 'costume', description: 'costume', required: true }]

  static flags = {
    wardrobe: Flags.string({ char: 'w', description: 'wardrobe' }),
    no_accessories: Flags.boolean({ char: 'n', description: 'not install accessories' }),
    silent: Flags.boolean({ char: 's' }),
    verbose: Flags.boolean({ char: 'v' }),
    help: Flags.help({ char: 'h' })
  }

  async run(): Promise<void> {
    const { argv, flags } = await this.parse(Wear)

    let verbose = flags.verbose
    Utils.titles(this.id + ' ' + this.argv)

    let no_accessories = false
    if (flags.no_accessories) {
      no_accessories = true
    }

    let wardrobe = await Utils.wardrobe()
    if (flags.wardrobe !== undefined) {
      wardrobe = flags.wardrobe
    }
    wardrobe = `${path.resolve(process.cwd(), wardrobe)}/`

    if (!fs.existsSync(wardrobe)) {
      Utils.warning(`wardrobe: ${wardrobe} not found!`)
      process.exit()
    }
    console.log(chalk.green(`wardrobe: `) + wardrobe)

    /**
     * costume
     */
    let costume = wardrobe + this.argv[0]
    if (!fs.existsSync(costume)) {
      console.log(`costume: ${chalk.green(path.basename(costume))} not found in wardrobe: ${chalk.green(wardrobe)}`)
      process.exit()
    }

    /**
    * tailorList
    */
    let tailorList = `${costume}/index.yml`
    if (!fs.existsSync(tailorList)) {
      Utils.warning(`index.yml not found in : ${costume}!`)
      process.exit()
    }


    if (await Utils.customConfirm(`Prepare your costume: ${costume}? Select yes to continue...`)) {
      if (Utils.isRoot()) {
        const tailor = new Tailor(costume)
        await tailor.prepare(verbose, no_accessories)
      } else {
        Utils.useRoot(this.id)
      }
    } else {
      console.log('costume ' + chalk.cyan(costume) + ' not found in wardrobe: ' + chalk.green(wardrobe))
    }
  }
}

