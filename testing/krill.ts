#!/usr/bin/npx ts-node

import Prepare from '../src/classes/krill_prepare'

const krill = new Prepare()

start()

async function start() {
    await krill.prepare(false, false, false)
}

