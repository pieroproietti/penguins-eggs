import {Command, flags} from '@oclif/command'
const exec = require('../lib/utils').exec

export default class Adjust extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Adjust)
    await exec(`xrandr --output Virtual-1 --auto`)
  }
}
