import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import chalk from 'chalk'

// libraries
import { exec } from '../../lib/utils'
import { basename } from 'path'


/**
 * 
 */
export default class Get extends Command {
  static description = 'get warorobe'

  static flags = {
    repo: Flags.string({ char: 'r', description: 'repository wardrobe' }),
    verbose: Flags.boolean({ char: 'v' }),
    help: Flags.help({ char: 'h' })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Get)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    const echo = Utils.setEcho(verbose)
    Utils.titles(this.id + ' ' + this.argv)

    let repo = 'https://github.com/pieroproietti/penguins-wardrobe'
    if (flags.repo !== undefined) {
      repo = flags.repo
    }
    
    let wardrobe = basename(repo) // ~/.eggs-wardrobe
    const result = await exec(`git clone --depth 1 ${repo} ~/.penguins-eggs/wardrobe.d`)
    if(result.code === 0) {
        Utils.warning(`you get new wardrobe: ${wardrobe} in ${process.cwd()}`)
    }
  }
}
