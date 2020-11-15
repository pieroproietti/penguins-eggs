/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Hatching from '../classes/hatching'

/**
 * Class Install
 */
export default class Install extends Command {
   static flags = {
      info: flags.help({ char: 'h' }),
      gui: flags.boolean({ char: 'g', description: 'use Calamares installer (gui)' }),
      mx: flags.boolean({ char: 'm', description: 'try to use MX installer (gui)' }),
      cli: flags.boolean({ char: 'c', description: 'try to use antiX installer (cli)' }),
      umount: flags.boolean({ char: 'u', description: 'umount devices' }),
      lvmremove: flags.boolean({char: 'l',description: 'remove lvm /dev/pve'}),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }
   static description = 'eggs installer - (the egg became penguin)'

   static aliases = ['hatch']

   static examples = [`$ eggs install\nInstall the system with eggs cli installer(default)\n`]

   /**
    * Execute
    */
   async run() {
      Utils.titles('install')

      const { flags } = this.parse(Install)

      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      let umount = false
      if (flags.umount) {
         umount = true
      }

      let lvmremove = false
      if (flags.lvmremove) {
         lvmremove = true
      }

      if (Utils.isRoot()) {
         if (Utils.isLive()) {
            if (flags.gui) {
               shx.exec('calamares')
            } else if (flags.mx || flags.cli) {
               antiX()
            } else {
               const hatching = new Hatching()
               if (lvmremove) {
                  Utils.warning('Removing lvm')
                  await hatching.lvmRemove(verbose)
                  Utils.titles('install')
               }
               Utils.warning('Installing the system / spawning the egg...')
               await hatching.questions(verbose, umount)
            }
         } else {
            Utils.warning(`You are in an installed system!`)
         }
      }
   }
}


async function antiX() {
   // la root è /live/linux

   // shx.exec('rm /live -rf')
   // shx.exec('mkdir /live/linux/home/demo -p')
   // shx.exec('mkdir /live/aufs/boot -p')
   // shx.exec('mkdir /live/boot-dev/antiX/ -p')
   // shx.exec('ln -s /run/live/medium/live/filesystem.squashfs /live/boot-dev/antiX/linuxfs')

   shx.exec('rm /live -rf')
   shx.exec('mkdir /live')
   // Forse non serve
   shx.exec('mkdir /live/boot-dev/antiX/linuxfs -p')
   shx.exec('ln -s /run/live/medium/live/filesystem.squashfs /live/boot-dev/antiX/linuxfs')

   shx.exec('mkdir /live/linux')
   shx.exec(`mount -t overlay overlay -o lowerdir=/live/boot-dev/antiX/linuxfs,upperdir=/run/live/overlay/rw,workdir=/run/live/overlay/work /live/linux`)
   shx.exec('ln -s /live/linux/home/live /live/linux/home/demo') 
   
   shx.exec('ln -s /run/live/medium /live/boot-dev')
   
   // Fino qua OK minstall parte

   // Creazione delle partizioni di mount
   shx.exec('mkdir /mnt/antiX/ -p')
   // shx.exec('mkdir /mnt/antiX/boot/efi -p')
   // shx.exec('mount --bind /boot/efi /mnt/antiX/boot/efi ')

   shx.exec('mkdir /mnt/antiX/proc -p')
   shx.exec('mount --bind /proc /mnt/antiX/proc ')

   shx.exec('mkdir /mnt/antiX/sys -p')
   shx.exec('mount --bind /sys /mnt/antiX/sys ')

   shx.exec('mkdir /mnt/antiX/dev -p')
   shx.exec('mount --bind /dev /mnt/antiX/dev ')

   console.log('exportimental!!!')
   console.log('Try to use:')
   console.log('sudo cli-installer')
   console.log('or')
   console.log('sudo minstall')

   // shx.exec('/mnt/antiX/dev/shm -p')
   // shx.exec('/mnt/antiX/home -p')

   //shx.exec('minstall')
}

