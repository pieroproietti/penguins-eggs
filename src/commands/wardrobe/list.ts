import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import path from 'path'
import yaml from 'js-yaml'
import fs from 'fs'
import os from 'os'
import { ICostume } from '../../interfaces'

// libraries
import chalk from 'chalk'

/**
 * 
 */
export default class List extends Command {
  static description = 'list costumes and accessoires in wardrobe'

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

    let wardrobe = await Utils.wardrobe()
    if (flags.wardrobe !== undefined) {
        wardrobe = flags.wardrobe
    }

    if (!fs.existsSync(wardrobe)) {
      Utils.warning(`wardrobe: ${wardrobe} not found!`)
      process.exit()
    }

    const costumes = fs.readdirSync(wardrobe)
    console.log(chalk.green(`wardrobe: `) + wardrobe)
    console.log()
    console.log(chalk.green(`costumes: `))
    costumes.forEach(costume => {
      if (fs.existsSync(`${wardrobe}/${costume}/index.yml`)) {
        const materials = yaml.load(fs.readFileSync(`${wardrobe}/${costume}/index.yml`, 'utf-8')) as ICostume
        console.log(chalk.cyan(costume) + ': ' + materials.description)
      }
    })

    if (!fs.existsSync(`${wardrobe}/accessories/`)) {
      Utils.warning(`accessories not founf`)
      process.exit()
    }
    console.log()
    console.log(chalk.green(`accessories department: `))
    const accessories = fs.readdirSync(`${wardrobe}/accessories/`)
    accessories.forEach(accessory => {
      if (fs.existsSync(`${wardrobe}/accessories/${accessory}/index.yml`)) {
        const materials = yaml.load(fs.readFileSync(`${wardrobe}/accessories/${accessory}/index.yml`, 'utf-8')) as ICostume
        console.log(chalk.cyan(accessory) + ': ' + materials.description)
      }
    })
  }
}
