import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import path from 'path'
import yaml from 'js-yaml'
import fs from 'fs'
import { IRecipe } from '../../interfaces'
import Cooking from '../../classes/coocking'

export default class Prepare extends Command {
  static description = 'prepare the recipe: add repositoris, packages and so on to preparte your lunch'

  static flags = {
    recipe: Flags.string({ char: 'r', description: 'Recipe' }),
    verbose: Flags.boolean({ char: 'v' }),
    help: Flags.help({ char: 'h' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Prepare)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }
    const echo = Utils.setEcho(verbose)

    Utils.titles(this.id + ' ' + this.argv)

    let book = `${path.resolve(__dirname, '../../../recipes.d')}`

    let recipe = 'xfce4-minimal'
    if (flags.recipe !== undefined) {
      recipe = flags.recipe
    }

    if (Utils.isRoot() && (await Utils.customConfirm(`Prepare your recipe: ${recipe}? Select yes to continue...`))) {
      if (fs.existsSync(`${book}/${recipe}/index.yml`)) {
        const ingredients = yaml.load(fs.readFileSync(`${book}/${recipe}/index.yml`, 'utf-8')) as IRecipe

        // Go to prepare!
        const cook = new Cooking(ingredients)
        await cook.prepare(verbose)
      } else {
        Utils.warning(`Cannot find: ${book}/${recipe}/index.yml`)
      }
    }
  }
}
