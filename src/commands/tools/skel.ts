/**
 * ./src/commands/tools/skel.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import fs from 'node:fs'

import Utils from '../../classes/utils.js'
import Xdg from '../../classes/xdg.js'

export default class Skel extends Command {
  static description = 'update skel from home configuration'
  static examples = ['sudo eggs tools skel', 'sudo eggs tools skel --user user-to-be-copied']
  static flags = {
    help: Flags.help({ char: 'h' }),
    user: Flags.string({ char: 'u', description: 'user to be used' }),
    verbose: Flags.boolean({ char: 'v' })
  }

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Skel)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    let user = ''
    user = flags.user ? flags.user : await Utils.getPrimaryUser()

    Utils.warning(`user: ${user}`)

    const homeSource = `/home/${user}`
    if (!fs.existsSync(homeSource)) {
      Utils.error(`User ${user} not exist or not exist a proper home`)
      Utils.warning('terminate')
      process.exit(0)
    }

    if (Utils.isRoot()) {
      Utils.titles('skel')
      Xdg.skel(user, verbose)
    } else {
      Utils.useRoot(this.id)
    }
  }
}
