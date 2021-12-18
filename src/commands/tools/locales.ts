import { Command, Flags } from '@oclif/core'

import shx = require('shelljs')
import path = require('path')

import Utils from '../../classes/utils'
import I18n from '../../classes/i18n'

/**
 *
 */
export default class Locales extends Command {
  static description = 'install/clean locales'

  static flags = {
    help: Flags.help({ char: 'h' }),
    reinstall: Flags.boolean({ char: 'r', description: 'reinstall locales' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { args, flags } = await this.parse(Locales)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    let reinstall = false
    if (flags.reinstall) {
      reinstall = true
    }

    const echo = Utils.setEcho(verbose)

    if (Utils.isRoot()) {
      const i18n = new I18n(verbose)
      i18n.generate(reinstall)
    }
  }
}
