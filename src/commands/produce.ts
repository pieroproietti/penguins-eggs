/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, flags} from '@oclif/command'
import Utils from '../classes/utils'
import Ovary from '../classes/ovary'
import os = require('os')

interface Param {
  basename: string;
}

export default class Produce extends Command {
  static flags = {
    info: flags.help({char: 'h'}),
    fast: flags.boolean({char: 'f', description: 'compression fast'}),
    basename: flags.string({char: 'b', description: 'basename egg'}),
  }

  
  static description = 'the penguin produce an egg'

  static aliases = ['spawn', 'lay']

  static examples = [
    `$ eggs produce --basename uovo
the penguin produce an egg called uovo-i386-2020-01-18_2000.iso`]

  async run() {
    if (Utils.isRoot()) {

      const {flags} = this.parse(Produce)

      const basename = flags.basename ||  os.hostname()
      let compression = '' // se vuota, compression viene definita da loadsettings
      if (flags.fast) {
        compression = 'lz4'
      } 
      const ovary = new Ovary(compression)
      await ovary.fertilization()
      const eggName = ovary.produce(basename)

      this.log(`${Utils.getFriendName()} produce`)
      this.log(`\tegg: ${eggName}`)
    }
  }
}

