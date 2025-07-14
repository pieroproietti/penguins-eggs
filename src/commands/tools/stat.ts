/**
 * ./src/commands/tools/stat.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import axios from 'axios'
import https from 'node:https'

import Utils from '../../classes/utils.js'
const agent = new https.Agent({
  rejectUnauthorized: false
})
import yaml from 'js-yaml'

/**
 *
 */
export default class ToolsStat extends Command {
  static description = 'get statistics from sourceforge'

  static examples = ['eggs tools stat', 'eggs tools stat --month', 'eggs tools stat --year']

  static flags = {
    help: Flags.help({ char: 'h' }),
    month: Flags.boolean({ char: 'm', description: 'current month' }),
    year: Flags.boolean({ char: 'y', description: 'current year' })
  }

  /**
   *
   */
  async run(): Promise<void> {
    const { args, flags } = await this.parse(ToolsStat)
    Utils.titles(this.id + ' ' + this.argv)

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // current date
    // adjust 0 before single digit date
    const day = ('0' + yesterday.getDate()).slice(-2)

    // current month
    const month = ('0' + (yesterday.getMonth() + 1)).slice(-2)

    // current year
    const year = yesterday.getFullYear()

    const end = year + '-' + month + '-' + day
    let start = year + '-' + month + '-' + day

    if (flags.month) {
      start = year + '-' + month + '-01'
    }

    if (flags.year) {
      start = year + '-01-01'
    }

    this.log('start: ' + start + ', end: ' + end + '\n')
    await this.show(start, end, 'Packages/DEBS')
    console.log()
    await this.show(start, end, 'ISOS')
  }

  /**
   *
   * @param start
   * @param end
   * @param type
   */
  async show(start: string, end: string, type: string) {
    let url = `https://sourceforge.net/projects/penguins-eggs/files/${type}/stats/json`
    const request = '?start_date=' + start + '&end_date=' + end
    url += request

    const res = await axios.get(url, { httpsAgent: agent })

    console.log(type)
    for (const country of res.data.countries) {
      console.log('- ' + country[0] + ': ' + country[1])
    }
  }
}
