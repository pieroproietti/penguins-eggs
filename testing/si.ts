#!/usr/bin/pnpx ts-node

import Utils from '../src/classes/utils'
import { exec } from '../src/lib/utils'

main()

async function main() {
  Utils.titles()
  const uname = await exec('uname -r', {capture:true})
    console.log("uname: " + uname.data)

  /**
  const bd = await si.blockDevices()
  console.log(bd)
  for (const d of bd ) {
    console.log(d.name)
    console.log(d.type)
  }
  */
}

