const { Command, Flags } = require('@oclif/core')

class CLI extends Command {
  constructor(args, opts) {
    super(args, opts)
  }

  async run() {
    const { flags } = await this.parse(CLI)
    const name = flags.name || 'world'
    this.log(`hello ${name}!`)
    return { name }
  }
}

CLI.flags = {
  name: Flags.string({ char: 'n', description: 'name to print' })
}

module.exports = CLI
