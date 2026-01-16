/**
 * ./src/commands/wardrobe/wear.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Args, Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'

import Tailor from '../../classes/tailor.js'
import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'

/**
 *
 */
export default class Wear extends Command {
  static args = {
    repo: Args.string({ description: 'costume to wear', name: 'costume', required: false })
  }
  static description = 'wear costume/accessories from wardrobe'
  static examples = ['sudo eggs wardrobe wear duck', 'sudo eggs wardrobe wear accessories/firmwares', 'sudo eggs wardrobe wear wagtail/waydroid']
  static flags = {
    help: Flags.help({ char: 'h' }),
    no_accessories: Flags.boolean({ char: 'a', description: 'not install accessories' }),
    no_firmwares: Flags.boolean({ char: 'f', description: 'not install firmwares' }),
    verbose: Flags.boolean({ char: 'v' }),
    wardrobe: Flags.string({ char: 'w', description: 'wardrobe' })
  }

  async run(): Promise<void> {
    const { argv, flags } = await this.parse(Wear)

    const { verbose } = flags
    Utils.titles(this.id + ' ' + this.argv)

    let no_accessories = false
    if (flags.no_accessories) {
      no_accessories = true
    }

    let no_firmwares = false
    if (flags.no_firmwares) {
      no_firmwares = true
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

    console.log(chalk.green('wardrobe: ') + wardrobe)

    /**
     * costume
     */
    let costume = 'costumes/colibri'
    if (this.argv['0'] !== undefined) {
      costume = this.argv['0'] // 12345678                               12345678901                              1234567
      if (costume.slice(0, 8) !== 'costumes' && costume.slice(0, 11) !== 'accessories' && costume.slice(0, 7) !== 'servers') {
        costume = `costumes/${costume}`
      }
    }

    costume = wardrobe + costume
    console.log(costume)
    if (!fs.existsSync(costume)) {
      Utils.warning(`costume not found in : ${costume}!`)
      process.exit()
    }

    if (await Utils.customConfirm(`Prepare your costume: ${costume}? Select yes to continue...`)) {
      if (Utils.isRoot()) {
        const tailor = new Tailor(costume)
        // delete previous log
        await exec(`rm -f ${path.dirname(wardrobe)}/wardrobe.log`)
        await tailor.prepare(verbose, no_accessories, no_firmwares)
      } else {
        Utils.useRoot(this.id)
      }
    } else {
      console.log('costume ' + chalk.cyan(costume) + ' not found in wardrobe: ' + chalk.green(wardrobe))
    }
  }
}
