/**
 * ./src/commands/cuckoo.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import path from 'path'
const __dirname = path.dirname(new URL(import.meta.url).pathname)

import Utils from '../classes/utils.js'
import { exec } from '../lib/utils.js'

export default class Maker extends Command {
  static description = 'eggs maker'

  static examples = ['sudo eggs maker']

  static flags = {
    help: Flags.help({ char: 'h' })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Maker)

    Utils.titles(this.id + ' ' + this.argv)
    const maker = path.join(__dirname, '../../maker/eggsmaker.bin')

    await exec(maker)
  }
}
