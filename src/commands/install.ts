/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Installer from '../classes/hatching/installer'
import Options from '../classes/hatching/options'
import Pacman from '../classes/pacman'

/**
 * Class Install
 */
export default class Install extends Command {
   static flags = {
      cli: flags.boolean({ char: 'c', description: 'force use eggs CLI installer' }),
      mx: flags.boolean({ char: 'm', description: 'try to use GUI MX installer' }),
      umount: flags.boolean({ char: 'u', description: 'umount devices' }),
      lvmremove: flags.boolean({ char: 'l', description: 'remove lvm /dev/pve' }),
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }
   static description = 'system installer - the egg became a penguin'

   static aliases = ['hatch']

   static examples = [`$ eggs install\nInstall the system using GUI or CLI installer\n`]

   /**
    * Execute
    */
   async run() {
      Utils.titles(this.id + ' ' + this.argv)

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

      if (Utils.isRoot(this.id)) {
         // if (Utils.isLive()) {
         if (Pacman.packageIsInstalled('calamares') && !flags.cli) {
            shx.exec('calamares')
         } else if (flags.mx) {
            if (Pacman.packageIsInstalled('minstall')) {
               await mountAntix()
               shx.exec('minstall')
               await umountAntix()
            }
         } else {
            const installer = new Installer()
            if (lvmremove) {
               Utils.warning('Removing lvm')
               await installer.lvmRemove(verbose)
            }
            Utils.warning('Installing the system / spawning the egg...')
            const options = new Options()
            await options.getOptions(verbose, umount)

            const confirm = await options.confirm(verbose)
            if (confirm) {
               await installer.install(verbose, umount)
            }
         }
      } else {
         Utils.warning(`You are in an installed system!`)
      }
      //}
   }
}



/**
 * 
 */
async function umountAntix() {
   showexec('umount /media')

   showexec('umount /live/aufs/dev')
   showexec('umount /live/aufs/proc')
   showexec('umount /live/aufs/run')
   showexec('umount /live/aufs/sys')
   showexec('umount /live/aufs/tmp')
   showexec('umount /live/aufs')
   showexec('umount /live/aufs-ram')
   showexec('umount /live')
   showexec('rm /live -rf')

   showexec('umount /etc/live/config')
   showexec('umount /etc/live/bin')
}

/**
 * 
 */
async function mountAntix() {
   // creo mountpoint /live
   showexec('mkdir /live')

   // mount tmpfs in /live
   showexec('mount -t tmpfs -o rw,noatime,size=10240k,mode=755 tmpfs /live')

   // creo mountpoint /live/aufs
   showexec('mkdir /live/aufs')

   // creo mountpoint /live/aufs-ram
   showexec('mkdir /live/aufs-ram')

   // mount tmpfs in /live/aufs-ram
   showexec('mount -t tmpfs -o rw,noatime,size=1589248k tmpfs /live/aufs-ram')

   // collego il cd a /live/boot-dev
   showexec('ln -s /run/live/medium /live/boot-dev')

   // collego filesystem.squashfs in /live/linux
   showexec('ln -s /usr/lib/live/mount/rootfs/filesystem.squashfs/ /live/linux')

   // showexec('mount -t tmpfs -o rw,noatime,size=10240k tmpfs /media')

   // creo /live/aufs-ram/upper e /live/aufs-ram/work
   showexec('mkdir /live/aufs-ram/upper')
   showexec('mkdir /live/aufs-ram/work')

   // monto /live/aufs
   showexec('mount -t overlay -o lowerdir=/usr/lib/live/mount/rootfs/filesystem.squashfs,upperdir=/live/aufs-ram/upper,workdir=/live/aufs-ram/work  overlay /live/aufs') // 0 0
   // conversione dell'utente?
   showexec('ln -s /home/live /home/demo')

   // monto --bind /dev, /prov, /run, /sys e /tmp
   showexec('mount --bind /dev /live/aufs/dev')
   showexec('mount --bind /proc /live/aufs/proc')
   showexec('mount --bind /run /live/aufs/run')
   showexec('mount --bind /sys /live/aufs/sys')
   showexec('mount --bind /tmp /live/aufs/tmp')

   // in etc
   showexec('mount -t tmpfs -o rw,noatime,size=10240k,mode=755 tmpfs /etc/live/config')
   showexec('mount -t tmpfs -o rw,noatime,size=10240k,mode=755 tmpfs /etc/live/bin')
}

async function showexec(cmd = '') {
   console.log(cmd)
   shx.exec(cmd)
}


