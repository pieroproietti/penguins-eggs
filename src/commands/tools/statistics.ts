import { Command, flags } from '@oclif/command'
import Utils from '../../classes/utils'

export default class ToolsStatistics extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({ char: 'h' }),
    day: flags.boolean({ char: 'd', description: 'stats day' }),
    week: flags.boolean({ char: 'w', description: 'stats week' }),
    month: flags.boolean({ char: 'm', description: 'stats month' }),
    year: flags.boolean({ char: 'y', description: 'stats year' }),
  }

  static args = [{ name: 'file' }]

  static aliases = ['stat']

  async run() {
    const { args, flags } = this.parse(ToolsStatistics)
    Utils.titles(this.id + ' ' + this.argv)
    const start = Utils.formatDate(new Date()).substr(0,10)
    const end = Utils.formatDate(new Date()).substr(0,10)

    let url = 'https://sourceforge.net/projects/penguins-eggs/files/stats/json'
    const request = '?start_date=' + start + '&end_date=' + end
    url += request   
    console.log(url)
    const axios = require('axios').default
    const res = await axios.get(url)
    const data = res.data
    console.log(data)

  }
}
