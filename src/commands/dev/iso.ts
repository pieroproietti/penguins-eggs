/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import Ovary from '../../classes/ovary'
import Utils from '../../classes/utils'


export default class Efi extends Command {
  static description = 'efi'

  async run() {
    Utils.titles()

    const ovary = new Ovary
    if (await ovary.fertilization()) {
      await ovary.makeIsoImage()
    }
  }
}
