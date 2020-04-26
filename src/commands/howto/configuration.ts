import {Command, flags} from '@oclif/command'
import Utils from '../../classes/utils'
import chalk = require('chalk')

export default class HowtoConfiguration extends Command {
  static description = 'configure eggs'

  static flags = {
    help: flags.help({char: 'h'}),
  }


  async run() {
    const {args, flags} = this.parse(HowtoConfiguration)
   
    Utils.titles('howto:configure')
    console.log()
    console.log('To re-create ' + chalk.cyan ('/etc/penguins.conf')+ ', sudo eggs prerequisits -c' )
    console.log()
    console.log('To configure eggs, edit ' + chalk.cyan ('/etc/penguins.conf'))
    console.log('Example: change the place of the nest')
    console.log()
    console.log('snapshot_dir=/large-partition')
    console.log()
    console.log('further information are in the same file.')
  }
}
