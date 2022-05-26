#!/usr/bin/npx ts-node

/**
 * run with: npx ts-node
 * #!/usr/bin/npx ts-node
 */

import { exec } from '../src/lib/utils'
import Utils from '../src/classes/utils'
import path from 'path'
import fs from 'fs'
import I18n from '../src/classes/i18n'


console.clear()

// let localesAvailabe = fs.readdirSync('/usr/share/i18n/locales')
// console.log(localesAvailabe)

const i18n = new I18n

i18n.generate(false, 'it_IT', ['it_IT'])

process.exit()
