import { Command, flags } from '@oclif/command'

import shx = require('shelljs')
import path = require('path')

import Utils from '../classes/utils'


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
      if (verbose){
        console.log('creating a new /ect/locale.gen')
      }
      console.log(process.execPath)
      shx.cp(path.resolve(__dirname, '../../conf/locale.gen.template'), '/etc/locale.gen')
      shx.exec('/usr/sbin/localepurge', echo)
      shx.exec('/usr/sbin/locale-gen', echo)
      
    }
  }
}
