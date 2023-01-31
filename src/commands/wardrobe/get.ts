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

  static args = [{ name: 'repo', description: 'repository to get', required: false }]

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v' })
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
    if (this.argv['0'] !== undefined) {
      repo = this.argv['0']
    }

    // No sudo for get
    if (process.getuid && process.getuid() === 0) {
      Utils.warning(`You must run: eggs wardrobe get without sudo`)
      process.exit(0)
    }

      let wardrobe = basename(repo) // ~/.eggs-wardrobe
      const result = await exec(`git clone --depth 1 ${repo} ${await Utils.wardrobe()}`)
      if(result.code === 0) {
          Utils.warning(`you get new wardrobe from repo: ${repo} in ${await Utils.wardrobe()}`)
    }
  }
}
