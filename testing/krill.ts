#!/usr/bin/pnpx ts-node

import Prepare from '../src/classes/krill_prepare'

const krill = new Prepare()

start()

async function start() {
    const kripted = false
    const pve = false
    const verbose = false

    await krill.prepare(kripted, pve, verbose)
}

