import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import path from 'path'
import yaml from 'js-yaml'
import fs from 'fs'
import { ICostume } from '../../interfaces'

// libraries
import chalk from 'chalk'

/**
 * 
 */
export default class List extends Command {
  static description = 'list, wear costumes'

  static flags = {
    wardrobe: Flags.string({ char: 'w', description: 'wardrobe' }),
    verbose: Flags.boolean({ char: 'v' }),
    help: Flags.help({ char: 'h' })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(List)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    const echo = Utils.setEcho(verbose)
    Utils.titles(this.id + ' ' + this.argv)

    let wardrobe = `${path.resolve(__dirname, '../../../wardrobe.d')}`

    let position = "eggs"
    if (flags.wardrobe !== undefined) {
      position = "external"
      wardrobe = flags.wardrobe
    }

    const costumes = fs.readdirSync(wardrobe)
    console.log(chalk.green(`${position} wardrobe: `) + wardrobe)
    console.log()
    costumes.forEach(costume => {
      if (fs.existsSync(`${wardrobe}/${costume}/index.yml`)) {
        const materials = yaml.load(fs.readFileSync(`${wardrobe}/${costume}/index.yml`, 'utf-8')) as ICostume
        console.log(chalk.cyan(costume) + ': ' + materials.description)
      }
    })
  }
}
