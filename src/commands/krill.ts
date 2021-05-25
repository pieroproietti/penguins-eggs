import { Command, flags } from '@oclif/command'
import { utimes } from 'fs'

import Krill2 from '../classes/krill_prepare'
import Utils from '../classes/utils'


export default class Krill extends Command {
  static description = 'a nice CLI system installer'

  static flags = {
    help: flags.help({ char: 'h' }),
  }

  async run() {
    const { args, flags } = this.parse(Krill)

    if (Utils.isRoot(this.id)) {
      if (Utils.isLive()) {
        const krill2 = new Krill2
        await krill2.prepare()
      } else {
        Utils.titles('You are on an installed system!')
      }
    }
  }
}

