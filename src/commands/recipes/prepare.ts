import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import path from 'path'
import yaml from 'js-yaml'
import fs from 'fs'
import { IRecipe } from '../../interfaces'

import { exec } from '../../lib/utils'

export default class Prepare extends Command {
  static description = 'prepare recipes'

  static flags = {
    recipe: Flags.string({ char: 'r', description: 'Recipe' }),
    verbose: Flags.boolean({ char: 'v' }),
    help: Flags.help({ char: 'h' })
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

    const ingredients = yaml.load(fs.readFileSync(`${book}/${recipe}/index.yml`, 'utf-8')) as IRecipe
    console.log(yaml.dump(ingredients))

    console.log(`We start checking repositories`)
    const repositories = 0
    const packages = 1
    const debs = 2
    console.log(yaml.dump(ingredients.sequence[repositories]))
    const rep = JSON.parse(yaml.dump(ingredients.sequence[repositories]))
    console.log('rep'  + rep)
    





    // console.log(yaml.dump(ingrediends.sequence[packages]))
    // console.log(yaml.dump(ingrediends.sequence[debs]))
  }
}
