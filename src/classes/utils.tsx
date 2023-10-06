/* eslint-disable valid-jsdoc */
/**
 * penguins-eggs
 * class: utils.tsx
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import shx from 'shelljs'
import fs from 'fs'
import dns from 'dns'
import path from 'path'
import os from 'os'
import yaml from 'js-yaml'
const inquirer = require('inquirer')
import chalk from 'chalk'
import Pacman from './pacman'
import { ChildProcess, spawnSync } from 'child_process'
import { Netmask } from 'netmask'

// libraries
import { exec } from '../lib/utils'
import Distro from './distro'
import Settings from './settings'
import { settings } from '@oclif/core'


const pjson = require('../../package.json')

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Utils {

   /**
    * Restituisce il prefisso della iso
    * @param distroId
    * @param codenameId
    */
   static snapshotPrefix(distroId: string, codenameId: string): string {
      let result = 'egg-of-' + distroId.toLowerCase() + '-' + codenameId.toLowerCase() + '-'
      result = result.replace(`/`, '-')
      return result
   }

   /**
   * Controlla se il sistema è avviato con systemd
   * funziona anche in MX che utilizza systemd
   * ma viene avviato con init
   */
   static isSystemd(): boolean {
      const checkFile = '/tmp/checksystemd'
      shx.exec(`ps -p 1 -o comm= >${checkFile}`)
      const isSystemd = fs.readFileSync(checkFile).includes('systemd')
      shx.exec(`rm ${checkFile}`)
      return isSystemd
   }

   /**
    *
    * @returns
    */
   static isSysvinit(): boolean {
      const checkFile = '/tmp/checkinit'
      shx.exec(`ps -p 1 -o comm= >${checkFile}`)
      const isSysvinit = fs.readFileSync(checkFile).includes('init')
      shx.exec(`rm ${checkFile}`)
      return isSysvinit
   }

   /**
    * ricava path per vmlinuz
    * Normalmente cerca BOOT_IMAGE
    * BOOT_IMAGE=/boot/vmlinuz-5.16.0-3-amd64 root=UUID=13768873-d6ba-4ae5-9e14-b5011f5aa31c ro quiet splash resume=UUID=beafb9b4-c429-4e1f-a268-4270b63a14e6
    * se non è presente, come nel caso di Franco, cerca initrd e ricostruisce vmlinuz
    * ro root=UUID=3dc0f202-8ac8-4686-9316-dddcec060c48 initrd=boot\initrd.img-5.15.0-0.bpo.3-amd64 // Conidi
    */
   static vmlinuz(): string {
      let distro = new Distro()
      let vmlinuz = ''

      // find vmlinuz in /proc/cmdline
      const cmdline = fs.readFileSync('/proc/cmdline', 'utf8').split(" ")
      cmdline.forEach(cmd => {
         if (cmd.includes('BOOT_IMAGE')) {
            vmlinuz = cmd.substring(cmd.indexOf('=') + 1)
         }
      })

      // btrfs
      if (vmlinuz.indexOf('@') > 0) {
         vmlinuz = vmlinuz.substring(vmlinuz.indexOf('@') + 1)
      }

      /**
       * blendOS: BOOT_IMAGE=/vmlinuz-linux
       *          but =/vmlinuz-linux exists in /boot/
       */
      if (vmlinuz === '/vmlinuz-linux' || vmlinuz === '/vmlinuz-linux-zen') {
         if (fs.existsSync(`/boot${vmlinuz}`)) {
            vmlinuz = `/boot${vmlinuz}`
         }
      }

      /** 
       * If vmlinuz not found
       */
      if (vmlinuz === '') {
         let version = 'linux'
         if (distro.familyId === 'debian') {
            cmdline.forEach(cmd => {
               if (cmd.includes('initrd.img')) {
                  version = cmd.substring(cmd.indexOf('initrd.img') + 10)
               }
            })
         } else if (distro.distroId === 'Manjaro') {
            cmdline.forEach(cmd => {
               if (cmd.includes('initrd.img')) {
                  version = cmd.substring(cmd.indexOf('initrd.img') + 10)
               }
            })
         }
         vmlinuz = '/boot/vmlinuz-' + version
      }

      /**
       * if not exists exit
       */
      if (!fs.existsSync(vmlinuz)) {
         console.log(vmlinuz + ' not exists!')
         process.exit()
      }

      return vmlinuz
   }

   /**
    * ricava path per initrdImg
    */
   static initrdImg(): string {
      const vmlinuz = Utils.vmlinuz()
      const path = vmlinuz.substring(0, vmlinuz.lastIndexOf('/')) + '/'
      let initrd = 'initrd.img'
      let version = 'linux'
      let suffix = ''

      let distro = new Distro()
      if (distro.familyId === 'debian') {
         version = vmlinuz.substring(vmlinuz.indexOf('-') + 1)
      } else if (distro.familyId === 'archlinux') {
         initrd = 'initramfs'
         suffix = '.img'
      }

      if (distro.distroId === 'Manjaro') {
         version = vmlinuz.substring(vmlinuz.indexOf('-') + 1)
      }
      initrd = path + initrd + '-' + version + suffix
      return initrd
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
    *
    * @param msg
    */
   static warning(msg = '') {
      console.log(pjson.shortName + ' >>> ' + chalk.cyanBright(msg) + '.')
   }

   static error(msg = '') {
      console.error(pjson.shortName + ' >>> ' + chalk.bgMagentaBright(chalk.whiteBright(msg)) + '.')
   }


   /**
    * Return the primary user's name
    */
   static async getPrimaryUser(): Promise<string> {
      let primaryUser = (await exec('/usr/bin/logname 2>/dev/null || echo ${SUDO_USER:-${USER}}', { echo: false, ignore: false, capture: true })).data.trim()
      // if logname don't work seem we get '' so:
      if (primaryUser === '') {
         primaryUser = shx.exec('echo $SUDO_USER', { silent: true }).stdout.trim()
      }
      if (primaryUser === '') {
         console.log(`Cannot find your user name...`)
         process.exit(1)
      }
      return primaryUser
   }

   /**
    * restituisce uuid
    * @param device
    */
   static uuid(device: string): string {
      const uuid = shx.exec(`blkid -s UUID -o value ${device}`).stdout.trim()
      return uuid
   }

   /**
    *
    * @param date
    */
   static formatDate(date: Date) {
      const d = new Date(date)
      let month = String(d.getMonth() + 1)
      let day = String(d.getDate())
      const year = d.getFullYear()
      let hh = String(d.getHours())
      let mm = String(d.getMinutes())

      if (month.length < 2) {
         month = '0' + month
      }

      if (day.length < 2) {
         day = '0' + day
      }

      if (hh.length < 2) {
         hh = '0' + hh
      }

      if (mm.length < 2) {
         mm = '0' + mm
      }

      return [year, month, day].join('-') + '_' + hh + mm
   }

   /**
    * return the name of the package: penguins-eggs
    * @returns penguins-eggs
    */
   static getPackageName(): string {
      return pjson.shortName
   }

   /**
    * Count the eggs present in the nest
    * @returns {number} Numero degli snapshot presenti
    */
   static getSnapshotCount(snapshot_dir = '/'): number {
      if (fs.existsSync(snapshot_dir)) {
         const files = fs.readdirSync(snapshot_dir)
         let nIsos = 0
         for (const f of files) {
            if (f.endsWith('.iso')) {
               nIsos++
            }
         }
         return nIsos
      }
      return 0
   }

   /**
    * Get the syze of the snapshot
    * @returns {string} grandezza dello snapshot in Byte
    */
   static getSnapshotSize(snapshot_dir = '/'): number {
      let fileSizeInBytes = 0
      const size = shx.exec(`/usr/bin/find ${snapshot_dir} -maxdepth 1 -type f -name '*.iso' -exec du -sc {} + | tail -1 | awk '{print $1}'`, { silent: true }).stdout.trim()

      if (size === '') {
         fileSizeInBytes = 0
      } else {
         fileSizeInBytes = Number(size)
      }
      return fileSizeInBytes
   }

   /**
    * uefiArch
    * @returns arch
    */
   static uefiArch(): string {
      let arch = ''
      if (process.arch === 'ia32') {
         arch = 'i386'
         // 
         if (shx.exec('uname -m', { silent: true }).stdout.trim() === 'x86_64') {
            arch = 'amd64'
         }
      } else if (process.arch === 'x64') {
         arch = 'amd64'
      } else if (process.arch === 'arm64') {
         arch = 'arm64'
      }
      return arch
   }

   /**
    * i386-efi,
    * x86_64-efi, 
    * arm64-efi,
    */
   static uefiFormat(): string {
      let format = ''
      if (process.arch === 'ia32') {
         format = 'i386-efi'
         if (shx.exec('uname -m', { silent: true }).stdout.trim() === 'x86_64') {
            format = 'x86_64-efi'
         }
      } else if (process.arch === 'x64') {
         format = 'x86_64-efi'
      } else if (process.arch === 'arm64') {
         format = 'arm64-efi'
      }
      return format
   }

   /**
    * 
    * @returns 
    */
   static uefiBN() {
    let bn = 'nothing.efi'
    if (process.arch === 'x64') {
      bn = 'bootx64.efi'
    } else if (process.arch === 'arm64') {
      bn = 'bootaa64.efi'
    }
    return bn
   }

   /**
    * 
    * @returns 
    */
   static usrLibPath() {
      let path = ''
      if (process.arch === 'x64') {
         path = 'x86_64-linux-gnu'
      } else if (process.arch === 'arm64') {
         path = 'aarch64-linux-gnu'
      }
      return path
   }


   /**
    *
    * @param prefix
    * @param backup
    * @returns
    */
   static getPrefix(prefix: string, backup = false) {
      if (backup) {
         if (prefix.substring(0, 7) === 'egg-of-') {
            prefix = 'egg-EB-' + prefix.substring(7)
         } else {
            prefix = 'egg-EB-' + prefix
         }
      }
      return prefix
   }

   /**
    *
    * @param volid
    */
   static getVolid(volid = 'unknown') {
      // // 28 +  4 .iso = 32 lunghezza max di volid
      if (volid.length >= 32) {
         volid = volid.substring(0, 32)
      }
      return volid
   }

   /**
    * Return postfix
    * @param basename
    * @returns eggName
    */
   static getPostfix(): string {
      let postfix = '_' + this.uefiArch() + '_' + Utils.formatDate(new Date()) + '.iso'
      return postfix
   }

   /**
    * Calculate the space used on the disk
    * @return {void}
    */
   static getUsedSpace(): number {
      let fileSizeInBytes = 0
      if (this.isLive()) {
         fileSizeInBytes = 0 // this.getLiveRootSpace()
      } else {
         fileSizeInBytes = Number(
            shx.exec(`df /home | /usr/bin/awk 'NR==2 {print $3}'`, {
               silent: true
            }).stdout
         )
      }
      return fileSizeInBytes
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

   /**
    * Return true if i686 architecture
    * @remarks to move in Utils
    * @returns {boolean} true se l'architettura è i686
    */
   static isi686(): boolean {
      return process.arch === 'ia32'
   }

   /**
    * Controlla se è un pacchetto deb
    * /usr/lib/penguins-eggs/bin/node
    */
   static isDebPackage(): boolean {
      let ret = false
      //if (process.execPath !== '/usr/bin/node') {
      if (process.execPath === '/usr/lib/penguins-eggs/bin/node') {
         ret = true
      }
      return ret
   }

   /**
    * Controlla se è un pacchetto sorgente
    */
   static isSources(): boolean {
      let ret = false
      if (__dirname.substring(0, 6) === '/home/') {
         ret = true
      }
      return ret
   }


   /**
    * Controlla se è un pacchetto npm
    */
   static isNpmPackage(): boolean {
      return !(this.isDebPackage() || this.isSources())
   }

   /**
    *
    */
   static rootPenguin(): string {
      return path.resolve(__dirname, '../../')
   }

   /**
    * return the short name of the package: eggs
    * @returns eggs
    */
   static getFriendName(): string {
      return pjson.shortName
   }

   /**
    * return the version of the package
    * @returns version example 8.0.0
    */
   static getPackageVersion(): string {
      return pjson.version
   }

   /**
    * Get author name
    */
   static getAuthorName(): string {
      return 'Piero Proietti piero.proietti@gmail.com'
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
    * Return true if live system
    * @returns {boolean} isLive
    */
   static isLive(): boolean {
      let retVal = false
      const paths = [
         '/lib/live/mount', // debian-live
         '/lib/live/mount/rootfs/filesystem.squashfs', // ubuntu bionic
         '/live/aufs',  // mx-linux
         '/run/miso/sfs/livefs', // ManjaroLinux
         '/run/archiso/airootfs' // Arch
      ]

      for (let i = 0; i < paths.length; i++) {
         if (Utils.isMountpoint(paths[i])) {
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
    *
    * @param command
    */
   static useRoot(command = ''): void {
      Utils.titles(pjson.shortName + ' ' + command + ` need to run with root privileges. Please, prefix it with sudo`)
   }

   /**
    * get the kernel version
    */
   static kernelVersion(): string {
      return os.release()
   }

   /**
    * return the name of network device
    */
   static async iface(): Promise<string> {
      // return shx.exec(`ifconfig | awk 'FNR==1 { print $1 }' | tr --d :`, { silent: true }).stdout.trim()
      const interfaces: any = Object.keys(os.networkInterfaces())
      let netDeviceName = ''
      for (const k in interfaces) {
         if (interfaces[k] != 'lo') {
            netDeviceName = interfaces[k]
         }
      }
      return netDeviceName
   }

   /**
    * address
    */
   static address(): string {
      const interfaces = os.networkInterfaces()
      let address = ''
      if (interfaces !== undefined) {
         for (const devName in interfaces) {
            const iface = interfaces[devName]
            if (iface !== undefined) {
               for (const alias of iface) {
                  if (
                     alias.family === 'IPv4' &&
                     alias.address !== '127.0.0.1' &&
                     !alias.internal
                  ) {
                     // take just the first!
                     if (address === '') {
                        address = alias.address
                     }
                  }
               }
            }
         }
      }
      return address
   }

   /**
    * netmask
    */
   static netmask(): string {
      const interfaces = os.networkInterfaces()
      let netmask = ''
      if (interfaces !== undefined) {
         for (const devName in interfaces) {
            const iface = interfaces[devName]
            if (iface !== undefined) {
               for (const alias of iface) {
                  if (
                     alias.family === 'IPv4' &&
                     alias.address !== '127.0.0.1' &&
                     !alias.internal
                  ) {
                     // take just the first!
                     if (netmask === '') {
                        netmask = alias.netmask
                     }
                  }
               }
            }
         }
      }
      return netmask
   }

   /**
    * cidr
    */
   static cidr(): string {
      const interfaces = os.networkInterfaces()
      let cidr = ''
      if (interfaces !== undefined) {
         for (const devName in interfaces) {
            const iface = interfaces[devName]
            if (iface !== undefined) {
               for (const alias of iface) {
                  if (
                     alias.family === 'IPv4' &&
                     alias.address !== '127.0.0.1' &&
                     !alias.internal
                  ) {
                     // take just the first!
                     if (cidr === '') {
                        if (alias.cidr !== null) {
                           cidr = alias.cidr
                        }
                     }
                  }
               }
            }
         }
      }
      return cidr
   }

   /**
    *
    * broadcast
   */
   static broadcast(): string {
      let n = new Netmask(Utils.cidr())
      return n.broadcast
   }

   /**
    * dns
    */
   static getDns(): string[] {
      return dns.getServers()
   }

   /**
    * getDomain
    */
   static getDomain(): string {
      return shx.exec('dnsdomainname', { silent: true }).stdout.trim()
      // return shx.exec(`route -n | grep 'UG[ \t]' | awk '{print $2}'`, { silent: true }).stdout.trim()
   }


   /**
    * @returns gateway
    */
   static gateway(): string {
      return shx.exec(`route -n | grep 'UG[ \t]' | awk '{print $2}'`, { silent: true }).stdout.trim()
   }

   /**
    * write a file
    * @param file
    * @param text
    */
   static write(file: string, text: string): void {
      text = text.trim() + '\n'
      text = text.trim() + '\n'
      file = file.trim()
      fs.writeFileSync(file, text)
   }

   /**
    *
    * @param file
    * @param cmd
    */
   static writeX(file: string, cmd: string): void {
      let text = `#!/bin/sh\n\n`
      text += `# Created at: ${Utils.formatDate(new Date())}\n`
      text += `# By: penguins_eggs v. ${Utils.getPackageVersion()}\n`
      text += `# ==> Perri\'s Brewery edition <== \n\n`
      text += cmd
      Utils.write(file, text)
      shx.chmod('+x', file)
   }

   /**
    *
    * @param file
    * @param cmd
    */
   static writeXs(file: string, cmds: string[]): void {
      let cmd = ''
      for (const elem of cmds) {
         cmd += elem + '\n'
      }
      Utils.writeX(file, cmd)
   }

   /**
    *
    * @param msg
    */
   static async customConfirm(msg = 'Select yes to continue... '): Promise<boolean> {
      const varResult = await Utils.customConfirmCompanion(msg)
      const result = JSON.parse(varResult)
      if (result.confirm === 'Yes') {
         return true
      } else {
         return false
      }
   }

   /**
    *
    * @param msg
    */
   static async customConfirmCompanion(msg = 'Select yes to continue... '): Promise<any> {
      return new Promise(function (resolve) {
         const questions: Array<Record<string, any>> = [
            {
               type: 'list',
               name: 'confirm',
               message: msg,
               choices: ['No', 'Yes'],
               default: 'No'
            }
         ]

         inquirer.prompt(questions).then(function (options: any) {
            resolve(JSON.stringify(options))
         })
      })
   }

   /**
    *
    * @param msg
    */
   static async customConfirmAbort(msg = 'Confirm'): Promise<any> {
      return new Promise(function (resolve) {
         const questions: Array<Record<string, any>> = [
            {
               type: 'list',
               name: 'confirm',
               message: msg,
               choices: ['No', 'Yes', 'Abort'],
               default: 'No'
            }
         ]

         inquirer.prompt(questions).then(function (options: any) {
            resolve(JSON.stringify(options))
         })
      })
   }


   /**
    *
    */
   static async pressKeyToExit(warming = 'Process will end', procContinue = true) {
      Utils.warning(warming)
      let msg = 'Press a key to exit...'
      if (procContinue) {
         msg = 'Press a key to continue...'
      }
      console.log(msg)

      const pressKeyToExit = spawnSync('read _ ', { shell: true, stdio: [0, 1, 2] })
      if (!procContinue) {
         process.exit(0)
      }
   }

   /**
    * titles
    * Penguin's are gettings alive!
    */
   static titles(command = '') {
      console.clear()
      console.log('')
      console.log(' E G G S: the reproductive system of penguins')
      console.log('')
      console.log(Utils.flag())
      console.log('command: ' + chalk.bgBlack.white(command) + '\n')
   }

   /**
    *
    * @returns flag
    */
   static flag(): string {
      return chalk.bgGreen.whiteBright('      ' + pjson.name + '      ') +
         chalk.bgWhite.blue(" Perri's Brewery edition ") +
         chalk.bgRed.whiteBright('       ver. ' + pjson.version + '       ')
   }


   /**
    *
    * @param verbose
    */
   static setEcho(verbose = false): object {
      let echo = { echo: false, ignore: true }
      if (verbose) {
         echo = { echo: true, ignore: false }
      }
      return echo
   }

   /**
    *
    * @param bytes
    * @param decimals
    * @returns
    */
   static formatBytes(bytes: number, decimals = 2): string {
      if (bytes === 0) return '0 Bytes';

      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
   }

   /**
    *
    * @returns wardrobe
    */
   static async wardrobe(): Promise<string> {
      let wardrobe = `${os.homedir()}/.wardrobe`
      if (Utils.isRoot()) {
         wardrobe = `/home/${await Utils.getPrimaryUser()}/.wardrobe`
      }
      return wardrobe
   }
}
