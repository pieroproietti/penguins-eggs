import { Command } from '@oclif/command'
import Utils from '../../classes/utils'
import chalk = require('chalk')

export default class DevGrub extends Command {
   static description = 'boot from grub rescue'

   async run() {
      Utils.titles('howto:grub')
      console.log(chalk.cyanBright('Commands to boot in the grub shell'))
      console.log()
      console.log(chalk.cyan('BIOS EFI'))
      console.log('set prefix=(hd0,1)/efi/Debian')
      console.log('set root=(hd0)')
      console.log('insmod linux')
      console.log('insmod normal')
      console.log('normal')
      console.log(chalk.cyan('BIOS standard'))
      console.log('set prefix=(hd0,1)/grub')
      console.log('set root=(hd0)')
      console.log('insmod linux')
      console.log('insmod normal')
      console.log('normal')
   }
}
