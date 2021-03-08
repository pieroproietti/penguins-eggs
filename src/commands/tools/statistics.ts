import { Command, flags } from '@oclif/command'
import Utils from '../../classes/utils'
const yaml = require('js-yaml')

export default class ToolsStatistics extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({ char: 'h' }),
    day: flags.boolean({ char: 'd', description: 'stats day' }),
    week: flags.boolean({ char: 'w', description: 'stats week' }),
    month: flags.boolean({ char: 'm', description: 'stats month' }),
    year: flags.boolean({ char: 'y', description: 'stats year' }),
  }

  static aliases = ['stat']

  async run() {
    const { args, flags } = this.parse(ToolsStatistics)
    Utils.titles(this.id + ' ' + this.argv)

    let date_ob = new Date();

    // current date
    // adjust 0 before single digit date
    let day = ("0" + date_ob.getDate()).slice(-2);

    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // current year
    let year = date_ob.getFullYear();

    let end = year + '-' + month + '-' + day 
    let start = year + '-' + month + '-' + day

    if (flags.month) {
      start= year + '-' + month + '-01' 
    }

    if (flags.year) {
      start= year + '-01-01' 
    }


    let url = 'https://sourceforge.net/projects/penguins-eggs/files/stats/json'
    const request = '?start_date=' + start + '&end_date=' + end
    url += request   
    console.log(url)
    const axios = require('axios').default
    const res = await axios.get(url)
    const data = res.data
    console.log(yaml.dump(data))

  }
}
