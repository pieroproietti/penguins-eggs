import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import path from 'path'
import yaml from 'js-yaml'
import fs from 'fs'

// libraries
import { exec } from '../../lib/utils'
import { fstat } from 'fs'
import { info } from 'console'

/**
 * 
 */
export default class List extends Command {
  static description = 'list, prepare recipes'

  static flags = {
    book: Flags.string({ char: 'b', description: 'book of recipes'}),
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

    if (flags.book !==undefined) {
      book = flags.book
    }

    const recipes = fs.readdirSync(book)

    recipes.forEach( recipe => {
      console.log(`- ${recipe}`)
      const ingredienfs = yaml.load(fs.readFileSync(`${book}/${recipe}/index.yml`, 'utf-8'))
      console.log(info.)
    })
  }
}

