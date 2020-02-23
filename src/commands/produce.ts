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

export default class Produce extends Command {
  static flags = {
    info: flags.help({char: 'h'}),
    fast: flags.boolean({char: 'f', description: 'compression fast'}),
    compress: flags.boolean({char: 'c', description: 'max compression'}),
    bindFs: flags.boolean({char: 'B', description: 'bind file systen (fast but unsure)'}),
    basename: flags.string({char: 'b', description: 'basename egg'}),
  }

  static description = 'the penguin produce an egg'

  static aliases = ['spawn', 'lay']

  static examples = [
    `$ eggs produce --basename uovo
the penguin produce an egg called uovo-i386-2020-01-18_2000.iso`]

  async run() {
    Utils.titles()
    if (Utils.isRoot() && Utils.prerequisitesInstalled()) {
      const {flags} = this.parse(Produce)

      const basename = flags.basename ||  os.hostname()
      let compression = '' // se vuota, compression viene definita da loadsettings
      if (flags.fast) {
        compression = 'lz4'
      } else if (flags.compress){
        compression = 'xz -Xbcj x86'
      }

      let bindedFs = false // se vuota viene eseguita la copia
      if (flags.bindFs){
        bindedFs = true
      }

      const ovary = new Ovary(compression, bindedFs)
  
      if (await ovary.fertilization()){
        ovary.produce(basename)
      }

      this.log(`${Utils.getFriendName()} produce`)
    }
  }
}

