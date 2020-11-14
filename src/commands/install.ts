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
   shx.exec('rm /live -rf')
   shx.exec('mkdir /live/linux/home/demo -p')
   shx.exec('mkdir /live/aufs/boot -p')
   shx.exec('mkdir /live/boot-dev/antiX/ -p')
   shx.exec('ln -s /run/live/medium/live/filesystem.squashfs /live/boot-dev/antiX/linuxfs')

   // Creazione delle partizioni di mount
   shx.exec('mkdir /mnt/antiX/ -p')
   shx.exec('mkdir /mnt/antiX/boot/efi -p')
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

/*
I mount originali di MXLINUX

/dev/sr0 on /live/boot-dev type iso9660 (ro,relatime,nojoliet,check=s,map=n,blocksize=2048)
/live/boot-dev/antiX/linuxfs on /live/linux type squashfs (ro,relatime)
proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)
overlay on / type overlay (rw,relatime,lowerdir=/live/linux,upperdir=/live/aufs-ram/upper,workdir=/live/aufs-ram/work)

sys on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)
devtmpfs on /dev type devtmpfs (rw,relatime,size=1015084k,nr_inodes=253771,mode=755)
devpts on /dev/pts type devpts (rw,nosuid,noexec,relatime,gid=5,mode=620,ptmxmode=000)
overlay on /live/aufs type overlay (rw,relatime,lowerdir=/live/linux,upperdir=/live/aufs-ram/upper,workdir=/live/aufs-ram/work)

tmpfs on /etc/live/config type tmpfs (rw,noatime,size=10240k,mode=755)
tmpfs on /etc/live/bin type tmpfs (rw,noatime,size=10240k,mode=755)
tmpfs on /run/lock type tmpfs (rw,nosuid,nodev,noexec,relatime,size=5120k)
tmpfs on /live/aufs-ram type tmpfs (rw,noatime,size=1589248k)
tmpfs on /media type tmpfs (rw,noatime,size=10240k)
tmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,noatime,size=204268k,mode=755)
tmpfs on /live type tmpfs (rw,noatime,size=10240k,mode=755)
tmpfs on /tmp type tmpfs (rw,noatime)
tmpfs on /dev/shm type tmpfs (rw,nosuid,nodev,noexec,relatime,size=408520k)

pstore on /sys/fs/pstore type pstore (rw,relatime)
rpc_pipefs on /run/rpc_pipefs type rpc_pipefs (rw,relatime)
cgroup on /sys/fs/cgroup type tmpfs (rw,relatime,size=12k,mode=755)
systemd on /sys/fs/cgroup/systemd type cgroup (rw,nosuid,nodev,noexec,relatime,release_agent=/run/cgmanager/agents/cgm-release-agent.systemd,name=systemd)
tmpfs on /run/user/1000 type tmpfs (rw,nosuid,nodev,relatime,size=204264k,mode=700,uid=1000,gid=1000)
gvfsd-fuse on /run/user/1000/gvfs type fuse.gvfsd-fuse (rw,nosuid,nodev,relatime,user_id=1000,group_id=1000)
*/

/*
I mount di penguins-eggs
/dev/sr0 on /run/live/medium type iso9660 (ro,noatime,nojoliet,check=s,map=n,blocksize=2048)
/dev/loop0 on /run/live/rootfs/filesystem.squashfs type squashfs (ro,noatime)
proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)
overlay on / type overlay (rw,noatime,lowerdir=/run/live/rootfs/filesystem.squashfs/,upperdir=/run/live/overlay/rw,workdir=/run/live/overlay/work)


udev on /dev type devtmpfs (rw,nosuid,relatime,size=1985708k,nr_inodes=496427,mode=755)
devpts on /dev/pts type devpts (rw,nosuid,noexec,relatime,gid=5,mode=620,ptmxmode=000)
tmpfs on /run type tmpfs (rw,nosuid,noexec,relatime,size=404112k,mode=755)
tmpfs on /run/live/overlay type tmpfs (rw,noatime,size=2020552k,mode=755)
tmpfs on /usr/lib/live/mount type tmpfs (rw,nosuid,noexec,relatime,size=404112k,mode=755)
/dev/sr0 on /usr/lib/live/mount/medium type iso9660 (ro,noatime,nojoliet,check=s,map=n,blocksize=2048)
/dev/loop0 on /usr/lib/live/mount/rootfs/filesystem.squashfs type squashfs (ro,noatime)
tmpfs on /usr/lib/live/mount/overlay type tmpfs (rw,noatime,size=2020552k,mode=755)
tmpfs on /run/lock type tmpfs (rw,nosuid,nodev,noexec,relatime,size=5120k)
pstore on /sys/fs/pstore type pstore (rw,relatime)
tmpfs on /dev/shm type tmpfs (rw,nosuid,nodev,noexec,relatime,size=808220k)
tmpfs on /tmp type tmpfs (rw,nosuid,nodev,relatime)
rpc_pipefs on /run/rpc_pipefs type rpc_pipefs (rw,relatime)
cgroup on /sys/fs/cgroup type tmpfs (rw,relatime,size=12k,mode=755)
systemd on /sys/fs/cgroup/systemd type cgroup (rw,nosuid,nodev,noexec,relatime,release_agent=/run/cgmanager/agents/cgm-release-agent.systemd,name=systemd)
tmpfs on /run/user/1000 type tmpfs (rw,nosuid,nodev,relatime,size=404108k,mode=700,uid=1000,gid=1000)
gvfsd-fuse on /run/user/1000/gvfs type fuse.gvfsd-fuse (rw,nosuid,nodev,relatime,user_id=1000,group_id=1000)
*/
