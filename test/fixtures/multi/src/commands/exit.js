const { Command, Flags } = require('@oclif/core')

class CLI extends Command {
  async run() {
    const { flags } = await this.parse(CLI)
    const code = Number.parseInt(flags.code || '1')
    this.log(`exiting with code ${code}`)
    this.exit(code)
  }
}

CLI.flags = {
  code: Flags.string()
}

module.exports = CLI
