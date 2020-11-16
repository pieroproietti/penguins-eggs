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
   // shx.exec('rm /live -rf')
   // shx.exec('mkdir /live/linux/home/demo -p')
   
showexec('rm /live -rf')
showexec('mkdir /live')

// Metto per primo la creazione dei tmpfs
showexec('mount -t tmpfs -o rw,noatime,size=10240k,mode=755 tmpfs /live')
showexec('mkdir /live/aufs-ram')
showexec('mount -t tmpfs -o rw,noatime,size=1589248k tmpfs /live/aufs-ram')

// monto il cd in /live-boot-dev
showexec('ln -s /run/live/medium /live/boot-dev')

// monto filesystem.squashfs in /live/linux
showexec('ln -s /usr/lib/live/mount/rootfs/filesystem.squashfs/ /live/linux')
showexec('mount -t tmpfs -o rw,noatime,size=10240k tmpfs /media')

// creo /live/aufs, /live/aufs-ram, /live/aufs-ram/upper e /live/aufs-ram/work
showexec('mkdir /live/aufs')
showexec('mkdir /live/aufs-ram')
showexec('mkdir /live/aufs-ram/upper')
showexec('mkdir /live/aufs-ram/work')
showexec('mount -t overlay -o lowerdir=/usr/lib/live/mount/rootfs/filesystem.squashfs,upperdir=/live/aufs-ram/upper,workdir=/live/aufs-ram/work  overlay /live/aufs') // 0 0
// conversione dell'utente?
// showexec('ln -s /live/aufs/home/live /live/aufs/home/demo')

// monto --bind /dev, /prov, /run, /sys e /tmp
showexec('mount --bind /dev /live/aufs/dev')
showexec('mount --bind /proc /live/aufs/proc')
showexec('mount --bind /run /live/aufs/run')
showexec('mount --bind /sys /live/aufs/sys')
showexec('mount --bind /tmp /live/aufs/tmp')

// in etc
showexec('mount -t tmpfs -o rw,noatime,size=10240k,mode=755 tmpfs /etc/live/config')
showexec('mount -t tmpfs -o rw,noatime,size=10240k,mode=755 tmpfs /etc/live/bin')

/**
 * Sorgenti 
 * /live/aufs/boot 
 * /live/aufs/bin 
 * /live/aufs/dev 
 * /live/aufs/etc 
 * /live/aufs/lib 
 * /live/aufs/lib64 
 * /live/aufs/media 
 * /live/aufs/mnt 
 * /live/aufs/opt 
 * /live/aufs/root 
 * /live/aufs/sbin 
 * /live/aufs/selinux 
 * /live/aufs/usr 
 * /live/aufs/var 
 * /live/aufs/home 
 * dest= /mnt/antiX
*/ 

   console.log('This is just exportimental!!!')
   console.log('Try to use:')
   console.log('sudo minstall')

   // shx.exec('/mnt/antiX/dev/shm -p')
   // shx.exec('/mnt/antiX/home -p')

   //shx.exec('minstall')
}

function showexec (cmd = '') {
   console.log( cmd )
   shx.exec(cmd)
}


