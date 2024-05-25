/**
 * penguins-eggs
 * command: get.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Args, Command, Flags} from '@oclif/core'
import Utils from '../../classes/utils'

// libraries
import {exec} from '../../lib/utils'
import { basename } from 'path';

/**
 *
 */
export default class Get extends Command {
  static flags = {
    help: Flags.help({char: 'h'}),
    verbose: Flags.boolean({char: 'v'}),
  }

  static args = {
    repo: Args.string({name: 'repo', description: 'repository to get', required: false}),
  }

  //static args ={name: 'repo', description: 'repository to get', required: false}
  static description = 'get warorobe'
  static examples=[
    'eggs wardrobe get',
    'eggs wardrobe get your-wardrobe',
  ]

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Get)

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
      Utils.warning('You must run: eggs wardrobe get without sudo')
      process.exit(0)
    }

    const wardrobe = basename(repo) // ~/.eggs-wardrobe
    // git clone -b <branchname> --single-branch 
    // const result = await exec(`git clone -b devel --single-branch --depth 1 ${repo} ${await Utils.wardrobe()}`)
    const result = await exec(`git clone --single-branch --depth 1 ${repo} ${await Utils.wardrobe()}`)
    if (result.code === 0) {
      Utils.warning(`you get new wardrobe from repo: ${repo} in ${await Utils.wardrobe()}`)
    }
  }
}
