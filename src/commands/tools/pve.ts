/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import Utils from '../../classes/utils'
import PveLite from '../../classes/pve-lite'

export default class Pve extends Command {
   static description = 'enable/start/stop pve-live'

   static flags = {
      help: flags.help({ char: 'h' }),
      enable: flags.boolean({ char: 'e', description: 'enable' }),
      disable: flags.boolean({ char: 'd', description: 'disable' }),
      start: flags.boolean({ description: 'start' }),
      stop: flags.boolean({ description: 'stop service' }),
      verbose: flags.boolean({ char: 'v', description: 'stop service' }),
   }

   async run() {
      const { flags } = this.parse(Pve)
      Utils.titles(this.id + ' ' + this.argv)

      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      if (Utils.isRoot()) {
         if (await Utils.customConfirm(`Select yes to continue...`)) {
            const pveLite = new PveLite()
            
            if (flags.disable) {
                pveLite.disable()
            }

            if (flags.enable) {
                pveLite.enable()
            }

            if (flags.start) {
                pveLite.start()
            }
            if (flags.stop) {
                pveLite.stop()
            }

         }
      }
   }
}
