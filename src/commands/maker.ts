/**
 * ./src/commands/cuckoo.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import fs from 'fs'
import Utils from '../classes/utils.js'
import { exec } from '../lib/utils.js'

export default class Maker extends Command {
  static description = 'eggs maker: a GUI for penguin-eggs'
  static examples = ['eggs maker']

  static flags = {
    help: Flags.help({ char: 'h' })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Maker)
    const eggsmaker='/usr/bin/_eggsmaker'

    Utils.titles(this.id + ' ' + this.argv)
    if (fs.existsSync(eggsmaker)) {
      await exec(eggsmaker)
    } else {
      console.log("eggsmaker not found")
    }
  }
}
