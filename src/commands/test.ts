/* eslint-disable no-console */
import {Command} from '@oclif/command'
import drivelist = require('drivelist')
import {IDevices, IDevice} from '../interfaces'

export default class Test extends Command {
  static description = 'test pourpouse...'

  async run() {
    const drives: any = await drivelist.list()
    console.log(drives)

    let aDrives: string[] = []
    drives.forEach((element: { device: string[] }) => {
      aDrives = element.device
    })
    console.log(aDrives)
  }
}

