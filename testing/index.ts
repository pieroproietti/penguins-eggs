#!/usr/bin/pnpx ts-node

/**
 * run with: npx ts-node
 * #!/usr/bin/pnpx ts-node
 */

import { exec } from '../src/lib/utils'
import Utils from '../src/classes/utils'
import path from 'path'
import fs from 'fs'
import I18n from '../src/classes/i18n'
import { mainModule } from 'process'


console.clear()
main()
process.exit()

async function main() {
    const i18n = new I18n

   await i18n.generate('it_IT', ['it_IT'])
    
}



