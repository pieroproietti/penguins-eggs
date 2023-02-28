
/**
 * run with: npx ts-node
 * #!/usr/bin/pnpx ts-node
 */

import {exec} from '../src/lib/utils'
import Utils from '../src/classes/utils'
import fs from 'fs'
import shx from 'shelljs'

import axios from 'axios'
import https from 'node:https'
const agent = new https.Agent({
  rejectUnauthorized: false,
})

Utils.titles('testing')

main()
// process.exit()

async function main() {
  const timezone: string = fs.readFileSync('/etc/timezone', 'utf8')
  let region = shx.exec('cut -f1 -d/ < /etc/timezone', {silent: true}).stdout.trim()
  let zone = shx.exec('cut -f2 -d/ < /etc/timezone', {silent: true}).stdout.trim()
  console.log('file region: ' + region)
  console.log('file zone: ' + zone)
  const url = 'https://geoip.kde.org/v1/calamares'

  try {
    const response = await axios.get(url)

    if (response.statusText === 'OK') {
      const data = JSON.stringify(response.data)
      const obj = JSON.parse(data)
      region = obj.time_zone.slice(0, Math.max(0, obj.time_zone.indexOf('/')))
      zone = obj.time_zone.slice(Math.max(0, obj.time_zone.indexOf('/') + 1))
    }
  } catch (error) {
    console.error('error: ' + error)
  }

  console.log('region: ' + region)
  console.log('zone: ' + zone)
}
