/**
 * ./src/classes/utils.d/system.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * System detection utilities - init systems, containers, live/installed detection
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs'
import shx from 'shelljs'
import { execSync } from 'child_process'
import Distro from '../distro.js'

export default class System {
   /**
    * Detect if running inside a container (Docker or LXC)
    */
   static isContainer(): boolean {
      let isContainer = false
      let pathToCheck = '/ci/README.md'
      if (fs.existsSync(pathToCheck)) {
         isContainer = true
      }
      return isContainer
   }

   /**
    * Check if the system uses Systemd
    */
   static isSystemd(): boolean {
      let isSystemd = false
      if (!this.isContainer()) {
         isSystemd = fs.readFileSync("/proc/1/comm").includes('systemd')
      } else {
         isSystemd = true
         let distro = new Distro()
         if (distro.distroId === "Devuan") {
            isSystemd = false
         }
      }
      return isSystemd
   }

   /**
    * Check if the system uses SysVinit
    */
   static isSysvinit(): boolean {
      let isSysvinit = false
      if (!this.isContainer()) {
         isSysvinit = fs.readFileSync("/proc/1/comm").includes('init')
      } else {
         let distro = new Distro()
         if (distro.distroId === "Devuan") {
            isSysvinit = true
         }
      }
      return isSysvinit
   }

   /**
    * Check if the system uses OpenRC
    */
   static isOpenRc(): boolean {
      let isOpenRc = false
      if (!this.isContainer()) {
         try {
            execSync('command -v openrc')
            isOpenRc = true
         } catch (error) {
            isOpenRc = false
         }
      }
      return isOpenRc
   }

   /**
    * Return true if live system
    * @returns {boolean} isLive
    */
   static isLive(): boolean {
      let retVal = false
      const paths = [
         '/lib/live/mount', // debian-live
         '/run/live/rootfs/filesystem.squashfs', // debian trixie
         '/lib/live/mount/rootfs/filesystem.squashfs', // ubuntu bionic
         '/live/aufs',  // mx-linux
         '/media/root-rw', // AlpineLinux
         '/run/archiso/airootfs', // Arch
         '/run/miso/sfs/livefs', // Manjarolinux
         '/run/rootfsbase' // Fedora
      ]
      for (let i = 0; i < paths.length; i++) {
         if (System.isMountpoint(paths[i])) {
            retVal = true
         }
      }
      return retVal
   }

   /**
    * Ritorna vero se path è un mountpoint
    * @param path
    */
   static isMountpoint(path = ''): boolean {
      const cmd = `mountpoint -q ${path}`
      // return 0 if the directory is a mountpoint, non-zero if not.
      const result: number = shx.exec(cmd, { silent: true }).code
      return result === 0
   }

   /**
    * 
    * @param device 
    * @returns 
    */
   static isBlockDevice(device = ''): boolean { // /dev/sda
      const cmd = `lsblk -d -o name | grep ${device}`
      const result: number = shx.exec(cmd, { silent: true }).code
      return result === 0
   }

   /**
    * return true if eggs run as root
    * @returns isRoot
    */
   static isRoot(command = ''): boolean {
      if (process.getuid && process.getuid() === 0) {
         return true
      }
      return false
   }

   /**
    * Occore vedere un modo per creare machine-id dove non esiste
    */
   static machineId(): string {
      let result = ''
      if (fs.existsSync('/etc/machine-id')) {
         result = fs.readFileSync('/etc/machine-id', 'utf-8').trim()
      } else if (fs.existsSync('/var/lib/dbus/machine-id')) {
         result = fs.readFileSync('/var/lib/dbus/machine-id', 'utf-8').trim()
      }
      return result
   }

   /**
    * Return the Debian version
    * @returns {number} Versione di Debian
    */
   static getDebianVersion(): number {
      const cmd = "cat /etc/debian_version | /usr/bin/cut -f1 -d'.'"
      const version = Number(shx.exec(cmd, { silent: true }).stdout)
      return version
   }

   /**
    * Extimate the linuxfs dimension
    * probably is better to rename it as
    * getLiveSpaceRootNeed
    * @returns {number} Byte
    */
   static getLiveRootSpace(type = 'debian-live'): number {
      let squashFs = '/run/live/medium/live/filesystem.squashfs'
      if (type === 'mx') {
         squashFs = '/live/boot-dev/antiX/linuxfs'
      }
      // Ottengo la dimensione del file compresso
      const compressedFs = fs.statSync(squashFs).size
      // get compression factor by reading the linuxfs squasfs file, if available
      const compressedFs_compression_type = shx.exec(`dd if=${compressedFs} bs=1 skip=20 count=2 status=none 2>/dev/null| /usr/bin/od -An -tdI`)
      let compression_factor = 0
      if (compressedFs_compression_type === '1') {
         compression_factor = 37 // gzip
      } else if (compressedFs_compression_type === '2') {
         compression_factor = 52 // lzo, not used by antiX
      } else if (compressedFs_compression_type === '3') {
         compression_factor = 52 // lzma, not used by antiX
      } else if (compressedFs_compression_type === '4') {
         compression_factor = 31 // xz
      } else if (compressedFs_compression_type === '5') {
         compression_factor = 52 // lz4
      } else {
         compression_factor = 30 // anything else or linuxfs not reachable (toram), should be pretty conservative
      }
      let rootfs_file_size = 0
      const linuxfs_file_size = (Number(shx.exec('df /live/linux --output=used --total | /usr/bin/tail -n1').stdout.trim()) * 1024 * 100) / compression_factor
      if (fs.existsSync('/live/persist-root')) {
         rootfs_file_size = Number(shx.exec('df /live/persist-root --output=used --total | /usr/bin/tail -n1').stdout.trim()) * 1024
      }
      let rootSpaceNeeded: number
      if (type === 'mx') {
         /**
          * add rootfs file size to the calculated linuxfs file size. Probaby conservative, as rootfs will likely have some overlap with linuxfs
          */
         rootSpaceNeeded = linuxfs_file_size + rootfs_file_size
      } else {
         rootSpaceNeeded = linuxfs_file_size
      }
      return rootSpaceNeeded / 1073741824.0 // Converte in GB
   }
}