#!/usr/bin/npx ts-node

/**
 * run with: npx ts-node
 * #!/usr/bin/npx ts-node
 */

 import { exec } from '../src/lib/utils'
 import Utils from '../src/classes/utils'
 import Xdg from '../src/classes/xdg'
 startPoint()
 
 
 
 async function startPoint() {
    Utils.titles('XDG autologin test')
    await Xdg.autologin('artisan', 'new', '')
 }

 