import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import path from 'path'
import yaml from 'js-yaml'
import fs from 'fs'
import { ICostume } from '../../interfaces'
import Tailor from '../../classes/tailor'

export default class Wear extends Command {
  static description = 'wear costume'

  static flags = {
    costume: Flags.string({ char: 'c', description: 'Costume' }),
    gardrobe: Flags.string({ char: 'g', description: 'Costume' }),
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

    let gardrobe = `${path.resolve(__dirname, '../../../gardrobe.d')}`
    if (flags.gardrobe != undefined) {
      gardrobe = flags.gardrobe
    }

    let costume = 'xfce4'
    if (flags.costume !== undefined) {
      costume = flags.costume
    }

    if (Utils.isRoot() && (await Utils.customConfirm(`Prepare your costume: ${costume}? Select yes to continue...`))) {
      if (fs.existsSync(`${gardrobe}/${costume}/index.yml`)) {
        const materials = yaml.load(fs.readFileSync(`${gardrobe}/${costume}/index.yml`, 'utf-8')) as ICostume

        // Go to prepare!
        const tailor = new Tailor(materials)
        await tailor.prepare(verbose)
      } else {
        Utils.warning(`Cannot find: ${gardrobe}/${costume}/index.yml`)
      }
    }
  }
}
