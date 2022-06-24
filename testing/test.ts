#!/usr/bin/pnpx ts-node

/**
 * run with: pnpx ts-node
 * #!/usr/bin/npx ts-node
 */

import I18n from '../src/classes/i18n'

import Utils from '../src/classes/utils'
 
 startPoint()
 
 
 
 async function startPoint() {
    Utils.titles('test')
    let i18n = new I18n('/home/artisan/')
    let defaultLocale = 'it_IT.UTF-8'
    let locales = ['it_IT.UTF-8', 'en_US.UTF-8']
    await i18n.generate(defaultLocale, locales)
 }

 