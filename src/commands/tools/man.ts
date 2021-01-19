import { Command, flags } from '@oclif/command'
import fs = require('fs')
import path = require('path')
import Utils from '../../classes/utils'
const exec = require('../../lib/utils').exec

export default class Man extends Command {
  static description = 'install man manual eggs'

  static flags = {
    help: flags.help({ char: 'h' }),
    remove: flags.boolean({ char: 'r', description: 'remove manual' }),
    verbose: flags.boolean({ char: 'v', description: 'verbose' }),
  }

  async run() {
    const { flags } = this.parse(Man)

    if (Utils.isRoot()) {

      const man1Dir = '/usr/local/man/man1'
      const man1eggs = '/usr/local/man/man1/eggs.1'
      if (fs.existsSync(man1eggs)) {
        exec(`rm ${man1eggs}`)
      }
      if (!flags.remove) {
        if (!fs.existsSync(man1Dir)) {
          exec(`mkdir ${man1Dir} -p`)
        }
        const manPage = path.resolve(__dirname, '../../../man/man1/eggs.1')
        exec(`cp ${manPage} ${man1Dir}`)
        if (flags.verbose) {
          exec(`mandb`)
        } else {
          exec(`mandb > /dev/null`)
        }
        console.log('use: man eggs to read the manual')
      } else {
        console.log('man eggs was removed')
      }
    }
  }
}
