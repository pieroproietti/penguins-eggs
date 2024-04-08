/**
 * penguins-eggs
 * command: list.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import path from 'path'
import yaml from 'js-yaml'
import fs from 'fs'
import { IMateria } from '../../interfaces/index'
import Distro from '../../classes/distro'

// libraries
import chalk from 'chalk'
import { fork } from 'child_process'

/**
 *
 */
export default class List extends Command {
  static flags = {
    help: Flags.help({ char: 'h' }),
    distro: Flags.string({ char: 'd', description: 'distro' }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  static args = [{ name: 'wardrobe', description: 'wardrobe', required: false }]
  static description = 'list costumes and accessoires in wardrobe'
  static examples = [
    'eggs wardrobe list',
    'eggs wardrobe list your-wardrobe',
    'eggs wardrobe list --distro arch',
  ]

  async run(): Promise<void> {
    const { args, flags } = await this.parse(List)

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

    if (flags.distro === undefined) {
      if (this.argv['0'] !== undefined) {
        wardrobe = this.argv['0']
      }
    }

    /**
     * seleziona distro
     */
    let index = ''
    let distro = new Distro()
    if (distro.distroLike === "Arch") {
      index = 'arch'
    } else if (distro.distroLike === "Debian" || distro.distroLike === "Devuan") {
      index = 'debian'
    } else if (distro.distroLike === "Ubuntu") {
      index = 'ubuntu'
    }
    if (flags.distro !== undefined) {
      index = flags.distro
    }
    index+='.yml'

    console.log(chalk.green('wardrobe: ') + wardrobe)
    console.log()

    wardrobe = `${path.resolve(process.cwd(), wardrobe)}/`

    if (!fs.existsSync(wardrobe)) {
      Utils.warning(`wardrobe: ${wardrobe} not found!`)
      process.exit()
    }

    /**
    * costumes
    */
    const costumes = fs.readdirSync(`${wardrobe}costumes/`)
    console.log(chalk.green('costumes: '))
    for (const costume of costumes) {
      if (fs.existsSync(`${wardrobe}costumes/${costume}/${index}`)) {
        const materials = yaml.load(fs.readFileSync(`${wardrobe}costumes/${costume}/${index}`, 'utf-8')) as IMateria
        console.log('- ' + chalk.cyan(costume) + ': ' + materials.description)
      }
    }

    console.log()

    /**
     * accessories
     */
    const accessories = fs.readdirSync(`${wardrobe}/accessories/`)
    console.log(chalk.green('accessories: '))
    for (const accessory of accessories) {
      if (fs.existsSync(`${wardrobe}/accessories/${accessory}/${index}`)) {
        const materials = yaml.load(fs.readFileSync(`${wardrobe}/accessories/${accessory}/${index}`, 'utf-8')) as IMateria
        console.log('- ' + chalk.cyan(accessory) + ': ' + materials.description)
      }
    }

    console.log()

    /**
     * servers
     */
    const servers = fs.readdirSync(`${wardrobe}/servers/`)
    console.log(chalk.green('servers: '))
    for (const server of servers) {
      if (fs.existsSync(`${wardrobe}/servers/${server}/${index}`)) {
        const materials = yaml.load(fs.readFileSync(`${wardrobe}/servers/${server}/${index}`, 'utf-8')) as IMateria
        console.log('- ' + chalk.cyan(server) + ': ' + materials.description)
      }
    }

    console.log()

    /**
     * vendors
     */
    const vendors = fs.readdirSync(`${wardrobe}/vendors/`)
    console.log(chalk.green('vendors/themes: '))
    for (const vendor of vendors) {
      if (fs.existsSync(`${wardrobe}/vendors/${vendor}/theme`)) {
        console.log('- ' + chalk.cyan(vendor)) 
      }
    }
  }
}
