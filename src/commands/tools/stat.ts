import { Command, flags } from '@oclif/command'
import Utils from '../../classes/utils'
const yaml = require('js-yaml')

export default class ToolsStat extends Command {
  static description = 'get statistics from sourceforge'

  static flags = {
    help: flags.help({ char: 'h' }),
    month: flags.boolean({ char: 'm', description: 'current month' }),
    year: flags.boolean({ char: 'y', description: 'current year' }),
  }

  static aliases = ['stat']

  async run() {
    const { args, flags } = this.parse(ToolsStat)
    Utils.titles(this.id + ' ' + this.argv)

    let yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // current date
    // adjust 0 before single digit date
    let day = ("0" + yesterday.getDate()).slice(-2);

    // current month
    let month = ("0" + (yesterday.getMonth() + 1)).slice(-2);

    // current year
    let year = yesterday.getFullYear();

    let end = year + '-' + month + '-' + day
    let start = year + '-' + month + '-' + day

    if (flags.month) {
      start = year + '-' + month + '-01'
    }

    if (flags.year) {
      start = year + '-01-01'
    }

    this.log('start: ' + start + ', end: ' + end + '\n')
    await this.show(start, end, 'packages-deb')
    await this.show(start, end, 'iso')
  }

  async show(start: string, end: string, type = 'packages-deb') {
    let url = `https://sourceforge.net/projects/penguins-eggs/files/${type}/stats/json`
    const request = '?start_date=' + start + '&end_date=' + end
    url += request
    console.log(type)
    const axios = require('axios').default
    const res = await axios.get(url)
    const data = res.data
    console.log(data.countries)
    //console.log(yaml.dump(data))
  }
}

