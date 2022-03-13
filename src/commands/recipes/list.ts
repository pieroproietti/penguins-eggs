import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import path from 'path'
import yaml from 'js-yaml'
import fs from 'fs'
import { IRecipe } from '../../interfaces'

// libraries
import { exec } from '../../lib/utils'
import { repository } from 'pjson'
import chalk from 'chalk'

/**
 * 
 */
export default class List extends Command {
  static description = 'list, prepare recipes'

  static flags = {
    book: Flags.string({ char: 'b', description: 'book of recipes' }),
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


    let book = `${path.resolve(__dirname, '../../../recipes.d')}`

    let bookshelf = "internal"
    if (flags.book !== undefined) {
      bookshelf = "extern"
      book = flags.book
    }

    const recipes = fs.readdirSync(book)
    console.log(chalk.green(`${bookshelf} book: ${book}`))
    console.log()
    recipes.forEach(recipe => {
      if (fs.existsSync(`${book}/${recipe}/index.yml`)) {
        console.log(`recipe: ${recipe}`)
        const ingredients = yaml.load(fs.readFileSync(`${book}/${recipe}/index.yml`, 'utf-8')) as IRecipe
        console.log(`description: ${ingredients.description}`)
        console.log(`author: ${ingredients.author}`)
      }
    })
  }
}
