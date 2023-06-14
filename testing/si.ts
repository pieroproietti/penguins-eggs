#!/usr/bin/pnpx ts-node

import Utils from '../src/classes/utils'
import si from 'systeminformation'

main()

async function main() {
  Utils.titles()

  const bd = await si.blockDevices()
  console.log(bd)
  for (const d of bd ) {
    console.log(d.name)
    console.log(d.type)
  }
}

