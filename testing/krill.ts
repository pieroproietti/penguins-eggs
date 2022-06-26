#!/usr/bin/pnpx ts-node

import Prepare from '../src/classes/krill_prepare'
import Hatching from '../src/classes/krill_install'
import Utils from '../src/classes/utils'

const krill = new Prepare()

start()

async function start() {
    const kripted = false
    const pve = false
    const verbose = false

    const prepare = await krill.prepare(kripted, pve, verbose)
}

