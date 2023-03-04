/**
 * penguins-eggs: wardrobe list
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import {Command, Flags} from '@oclif/core'
import Utils from '../../classes/utils'
import path from 'path'
import yaml from 'js-yaml'
import fs from 'fs'
import os from 'os'
import {IMateria} from '../../interfaces/index'

// libraries
import chalk from 'chalk'
import {Example} from '@oclif/core/lib/interfaces'

/**
 *
 */
export default class List extends Command {
  static flags = {
    help: Flags.help({char: 'h'}),
    verbose: Flags.boolean({char: 'v'}),
  }

  static args = [{name: 'wardrobe', description: 'wardrobe', required: false}]
  static description = 'list costumes and accessoires in wardrobe'
  static examples=[
    'eggs wardrobe list',
    'eggs wardrobe list your-wardrove',
  ]

  async run(): Promise<void> {
    const {args, flags} = await this.parse(List)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    const echo = Utils.setEcho(verbose)
    Utils.titles(this.id + ' ' + this.argv)

    /**
    * wardobe
    */
    let wardrobe = await Utils.wardrobe()
    if (this.argv['0'] !== undefined) {
      wardrobe = this.argv['0']
    }

    wardrobe = `${path.resolve(process.cwd(), wardrobe)}/`

    if (!fs.existsSync(wardrobe)) {
      Utils.warning(`wardrobe: ${wardrobe} not found!`)
      process.exit()
    }

    console.log(chalk.green('wardrobe: ') + wardrobe)
    console.log()

    /**
    * costumes
    */
    const costumes = fs.readdirSync(`${wardrobe}costumes/`)
    console.log(chalk.green('costumes: '))
    for (const costume of costumes) {
      if (fs.existsSync(`${wardrobe}costumes/${costume}/index.yml`)) {
        const materials = yaml.load(fs.readFileSync(`${wardrobe}costumes/${costume}/index.yml`, 'utf-8')) as IMateria
        console.log(chalk.cyan(costume) + ': ' + materials.description)
      }
    }

    console.log()

    /**
     * accessories
     */
    const accessories = fs.readdirSync(`${wardrobe}/accessories/`)
    console.log(chalk.green('accessories: '))
    for (const accessory of accessories) {
      if (fs.existsSync(`${wardrobe}/accessories/${accessory}/index.yml`)) {
        const materials = yaml.load(fs.readFileSync(`${wardrobe}/accessories/${accessory}/index.yml`, 'utf-8')) as IMateria
        console.log(chalk.cyan(accessory) + ': ' + materials.description)
      }
    }

    console.log()

    /**
     * servers
     */
    const servers = fs.readdirSync(`${wardrobe}/servers/`)
    console.log(chalk.green('servers: '))
    for (const server of servers) {
      if (fs.existsSync(`${wardrobe}/servers/${server}/index.yml`)) {
        const materials = yaml.load(fs.readFileSync(`${wardrobe}/servers/${server}/index.yml`, 'utf-8')) as IMateria
        console.log(chalk.cyan(server) + ': ' + materials.description)
      }
    }

    console.log()
  }
}
