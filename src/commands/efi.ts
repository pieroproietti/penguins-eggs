import { Command, flags } from '@oclif/command'
import Ovary from '../classes/ovary'

export default class Efi extends Command {
  static description = 'test efis'

  async run() {
    const ovary = new Ovary
    await ovary.fertilization()
    await ovary.isoCreateStructure()
    await ovary.isolinuxPrepare()
    await ovary.makeEfi()
  }
}

