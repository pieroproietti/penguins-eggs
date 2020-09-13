import { Command, flags } from '@oclif/command'

import shx = require('shelljs')
import path = require('path')

import Utils from '../classes/utils'
import I18n from '../classes/i18n'


export default class Locales extends Command {
    static description = 'install/clean localess'

    static flags = {
        help: flags.help({ char: 'h' }),
        verbose: flags.boolean({ char: 'v', description: 'verbose' }),
    }

    static args = [{ name: 'file' }]
    async run() {
        const { args, flags } = this.parse(Locales)

        let verbose = false
        if (flags.verbose) {
            verbose = true
        }

        const echo = Utils.setEcho(verbose)

        if (Utils.isRoot()) {
            const i18n = new I18n(verbose)
            i18n.generate()
        }
    }
}