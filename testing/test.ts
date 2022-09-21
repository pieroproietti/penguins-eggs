#!/usr/bin/pnpx ts-node

/**
 * run with: pnpx ts-node
 * #!/usr/bin/npx ts-node
 */


import {exec} from '../src/lib/utils'

import Utils from '../src/classes/utils'
import shx from 'shelljs'
import { execSync } from 'child_process'
 
 startPoint()
 
 
 
 async function startPoint() {
    Utils.titles('test')
    const fl =  shx.exec(`tr -dc a-z </dev/urandom | head -c 1 ; echo ''`, {silent: true}).trim()
    const sl = shx.exec(`tr -dc q-z </dev/urandom | head -c 2 ; echo ''`, {silent: true}).trim()
    const fn = shx.exec(`tr -dc 0-9 </dev/urandom | head -c 2 ; echo ''`, {silent: true}).trim()
    const sn = shx.exec(`tr -dc 0-9 </dev/urandom | head -c 2 ; echo ''`, {silent: true}).trim()
    console.log(`${fl}${fn}${sl}${sn}`)

    let now = new Date().toISOString()
    console.log(now)
    now = now.substring(0,19)
    now = now.replace('-', 'm')
    now = now.replace('-', 'd')
    now = now.replace('T', 'h')
    now = now.replace(':', 'm')
    now = now.replace(':', 's')

    console.log(now)

    // let i18n = new I18n('/home/artisan/')
    // let defaultLocale = 'it_IT.UTF-8'
    // let locales = ['it_IT.UTF-8', 'en_US.UTF-8']
    // await i18n.generate(defaultLocale, locales)
 }

 