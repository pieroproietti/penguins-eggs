/**
 * ./src/classes/utils.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * 
 * Refactored Utils class - imports from modular utilities
 */

import { shx } from '../lib/utils.js'
import fs from 'fs'
import dns from 'dns'
import path from 'path'
import os from 'os'
import inquirer from 'inquirer'
import { execSync, spawnSync } from 'child_process'
import chalk from 'chalk'

import Kernel from './utils.d/kernel.js'

// libraries
import Distro from './distro.js'

// interfaces
import IOsRelease from '../interfaces/i-os-release.js'

// pjson
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pjson = require('../../package.json');

// __dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname);

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Utils {
   static vmlinuz(kernel = ''): string {
      return Kernel.vmlinuz(kernel)
   }

   /**
    * @deprecated Use Kernel.initramfs() instead  
    */
   static initrdImg(kernel = ''): string {
      return Kernel.initramfs(kernel)
   }

   /**
   * Custom function to sort object keys
   * @param obj 
   * @returns 
   */
   static sortObjectKeys(obj: { [key: string]: any }): { [key: string]: any } {
      const sorted: { [key: string]: any } = {};
      Object.keys(obj)
         .sort()
         .forEach(key => {
            sorted[key] = obj[key];
         });
      return sorted;
   }


   /**
    * 
    * @param file 
    * @param search 
    * @returns value
    */
   static searchOnFile(file = '', search = ''): string {
      const lines = fs.readFileSync(file, 'utf8').split("\n")
      let value = ''
      lines.forEach(line => {
         line = line.replace(/\s+/g, ' ') // Remove multiple spaces with single space
         if (line.includes(search)) {
            value = line.substring(line.indexOf('=') + 1)
         }
      })
      value = value.replaceAll('"', '') // Remove "
      return value.trim()
   }

   /**
    * Restituisce il prefisso della iso
    * @param distroId
    * @param codenameId
    */
   static snapshotPrefix(distroId: string, codenameId: string): string {
      let result = `egg-of_${distroId.toLowerCase()}-`

      if (codenameId === 'rolling' || codenameId === '') {
         const releaseId = Utils.getOsRelease().VERSION_ID.trim()
         if (releaseId !== '') {
            result += releaseId
         }
      } else {
         result += `${codenameId.toLowerCase()}`
      }

      if (!result.endsWith('-')) {
         result += '-'
      }

      return result
   }

   /**
    * isAppImage
    */
   static isAppImage(): boolean {
      return !!process.env.APPIMAGE ||
         process.execPath.includes('.AppImage') ||
         process.execPath.includes('/tmp/.mount_');
   }

   /**
    * Detect if running inside a container (Docker or LXC)
    */
   static isContainer(): boolean {
      // Check for Docker's specific file
      if (fs.existsSync('/.dockerenv')) {
         return true;
      }

      // Check the cgroup file, which works for Docker, Podman, LXC, etc.
      try {
         const cgroupContent = fs.readFileSync('/proc/1/cgroup', 'utf8');
         return cgroupContent.includes('/docker/') || cgroupContent.includes('/kubepods/');
      } catch (e) {
         return false;
      }
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
    * Usata da pacman e config credo non serva affatto
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
      console.log(pjson.shortName + ' >>> ' + chalk.cyanBright(msg))
   }

   static info(msg = '') {
      console.log(pjson.shortName + ' >>> ' + chalk.white(msg))
   }

   static success(msg = '') {
      console.log(pjson.shortName + ' >>> ' + chalk.greenBright(msg))
   }

   static error(msg = '') {
      console.error(pjson.shortName + ' >>> ' + chalk.bgRed(chalk.whiteBright(msg)))
   }


   /**
    * Return the primary user's name
    */
   static async getPrimaryUser(): Promise<string> {
      const { execSync } = require('child_process');

      let primaryUser = '';
      try {
         // Attempt to get the user from logname
         primaryUser = execSync('/usr/bin/logname 2>/dev/null', { encoding: 'utf-8' }).trim();
      } catch (error) {
         // console.log("logname failed, so we continue with other methods")
      }
      if (primaryUser === 'root') {
         primaryUser = ''
      }

      if (primaryUser === '') {
         try {
            // Check if doas is installed and get the DOAS_USER
            execSync('command -v doas', { stdio: 'ignore' });
            primaryUser = execSync('echo $DOAS_USER', { encoding: 'utf-8' }).trim();
         } catch (error) {
            // console.log("doas is not installed or DOAS_USER is not set, continue with the next method")
         }
      }

      if (primaryUser === '') {
         try {
            // Check for the SUDO_USER
            primaryUser = execSync('echo $SUDO_USER', { encoding: 'utf-8' }).trim();
         } catch (error) {
            // console.log("SUDO_USER is not set, continue with the next method")
         }
      }

      if (primaryUser === '') {
         // console.log("Fallback to the USER environment variable")
         primaryUser = process.env.USER || '';
      }

      if (primaryUser === '') {
         primaryUser = 'dummy'
         // console.error('Cannot determine the primary user.');
         // process.exit(1);
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
    * @param device 
    * @returns 
    */
   static uuidGen(): string {
      const uuid = shx.exec(`uuidgen`, { silent: true }).stdout.trim()
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
    * i386-pc,
    * i386-efi,
    * x86_64-efi, 
    * arm64-efi,
    * 
    * ATTEMZIONE: install efibootmgr
    * 
    * Fedora/RHEL have i386-pc
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
         if (prefix.substring(0, 7) === 'egg-of_') {
            prefix = 'egg-bk_' + prefix.substring(7)
         } else {
            prefix = 'egg-bk_' + prefix
         }
      }
      return prefix
   }

   /**
    *
    * @param volid
    */
   static VolidTrim(volid = 'unknown') {
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
      let postfix = '_' + Utils.formatDate(new Date()) + '.iso'
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
   * Estimate the linuxfs dimension
   * (Refactored to use native FS instead of dd/od)
   * @returns {number} GB
   */
   static getLiveRootSpace(type = 'debian-live'): number {
      let squashFs = '/run/live/medium/live/filesystem.squashfs'
      if (type === 'mx') {
         squashFs = '/live/boot-dev/antiX/linuxfs'
      }

      // 1. Leggiamo il tipo di compressione DIRETTAMENTE dall'header del file SquashFS
      // L'identificativo della compressione è a offset 20 (2 bytes, little endian)
      // 1=gzip, 2=lzo, 3=lzma, 4=xz, 5=lz4, 6=zstd
      let compressionId = 0;

      try {
         if (fs.existsSync(squashFs)) {
            const fd = fs.openSync(squashFs, 'r');
            const buffer = Buffer.alloc(2);
            // Leggi 2 byte alla posizione 20
            fs.readSync(fd, buffer, 0, 2, 20);
            fs.closeSync(fd);
            compressionId = buffer.readUInt16LE(0);
         }
      } catch (e) {
         console.error("Error reading squashfs header:", e);
      }

      // 2. Determiniamo il fattore di compressione in base all'ID letto
      let compression_factor = 30; // Default conservative

      switch (compressionId) {
         case 1: // gzip
            compression_factor = 37;
            break;
         case 2: // lzo
            compression_factor = 52;
            break;
         case 3: // lzma
            compression_factor = 52;
            break;
         case 4: // xz
            compression_factor = 31;
            break;
         case 5: // lz4
            compression_factor = 52;
            break;
         case 6: // zstd (aggiunto per completezza)
            compression_factor = 37; // simile a gzip come ratio medio
            break;
         default:
            compression_factor = 30;
      }

      // 3. Calcolo dimensione Linux FS
      // Nota: shx.exec ritorna un oggetto, dobbiamo prendere .stdout e pulirlo
      let rootfs_file_size = 0;

      const dfCmdLinux = 'df /live/linux --output=used --total | /usr/bin/tail -n1';
      const dfResultLinux = shx.exec(dfCmdLinux, { silent: true }).stdout.trim();
      const linuxfs_used = Number(dfResultLinux) || 0; // Gestione caso NaN

      const linuxfs_file_size = (linuxfs_used * 1024 * 100) / compression_factor;

      // 4. Calcolo persist-root (se esiste)
      if (fs.existsSync('/live/persist-root')) {
         const dfCmdRoot = 'df /live/persist-root --output=used --total | /usr/bin/tail -n1';
         const dfResultRoot = shx.exec(dfCmdRoot, { silent: true }).stdout.trim();
         rootfs_file_size = (Number(dfResultRoot) || 0) * 1024;
      }

      let rootSpaceNeeded: number;
      if (type === 'mx') {
         rootSpaceNeeded = linuxfs_file_size + rootfs_file_size;
      } else {
         rootSpaceNeeded = linuxfs_file_size;
      }

      return rootSpaceNeeded / 1073741824.0; // Converte in GB
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
   static isPackage(): boolean {
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
      return !(this.isPackage() || this.isSources())
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
         '/run/live/rootfs/filesystem.squashfs', // debian trixie
         '/lib/live/mount/rootfs/filesystem.squashfs', // ubuntu bionic
         '/live/aufs',  // mx-linux
         '/media/root-rw', // AlpineLinux
         '/run/archiso/airootfs', // Arch
         '/run/miso/sfs/livefs', // Manjarolinux
         '/run/rootfsbase' // Fedora
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

   static broadcast(): string {
      const netmask = Utils.netmask()
      const ip = Utils.address()

      const ipParts = ip.split('.').map(Number);
      const maskParts = netmask.split('.').map(Number);

      const broadcastParts = ipParts.map((part, index) => {
         // Bitwise OR tra il blocco IP e il blocco Netmask invertito (255 - mask)
         return part | (255 - maskParts[index]);
      });

      return broadcastParts.join('.');
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
      return shx.exec('domainname', { silent: true }).stdout.trim()
      // return shx.exec(`route -n | grep 'UG[ \t]' | awk '{print $2}'`, { silent: true }).stdout.trim()
   }


   /**
    * @returns gateway
    */
   static gateway(): string {
      return shx.exec(`ip r | grep 'default' | awk '{print $3}'`, { silent: true }).stdout.trim()
      //return shx.exec(`route -n | grep 'UG[ \t]' | awk '{print $2}'`, { silent: true }).stdout.trim()
   }

   /**
    * write a file
    * @param file
    * @param text
    */
   static write(file: string, text: string): void {
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
         const questions: any = [
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
         const questions: any = [
            {
               type: 'list',
               name: 'confirm',
               message: msg,
               choices: ['No', 'Yes', 'Abort'],
               default: 'Yes'
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
   static async pressKeyToExit(warning = 'Process will end', procContinue = true) {
      Utils.warning(warning)
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

   static async debug(cmd = 'cmd', procContinue = true) {
      console.log(chalk.redBright('DEBUG >>> ') + cmd + '\n')
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
      let type = ''
      if (!Utils.isAppImage()) {
         type = ' native'
      }

      let title = `${pjson.name}`

      let green = ` ${title}`.padEnd(25, " ")
      let white = ` Perri's brewery edition `.padEnd(25, " ")
      let red = ` v${pjson.version}${type} `.padStart(25, " ")

      return chalk.bgGreen.whiteBright(green) +
         chalk.bgWhite.blue(white) +
         chalk.bgRed.whiteBright(red)
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




   // Se il metodo fa parte di una classe, usa `static`. Altrimenti, rimuovilo.
   static getOsRelease(): IOsRelease {
      const osReleasePath = path.join('/etc', 'os-release');

      // Inizializza l'oggetto con valori predefiniti
      const osInfo: IOsRelease = {
         ID: '',
         VERSION_ID: '',
         VERSION_CODENAME: 'n/a'
      };

      // Verifica se il file esiste
      if (!fs.existsSync(osReleasePath)) {
         console.error('/etc/os-release file does not exist.');
         return osInfo;
      }

      // Leggi il contenuto del file
      let fileContent: string;
      try {
         fileContent = fs.readFileSync(osReleasePath, 'utf8');
      } catch (error) {
         console.error('Error reading /etc/os-release:', error);
         return osInfo;
      }

      // Analizza ogni linea
      const lines = fileContent.split('\n');
      lines.forEach(line => {
         if (line.startsWith('#') || line.trim() === '') return;

         const [key, value] = line.split('=')
         if (key && value) {
            const trimmedKey = key.trim();
            const trimmedValue = value.trim().replace(/"/g, '');

            // Popola solo le chiavi desiderate
            if (trimmedKey === 'ID') {
               osInfo.ID = trimmedValue
            } else if (trimmedKey === 'VERSION_ID') {
               osInfo.VERSION_ID = trimmedValue
            } else if (trimmedKey === 'VERSION_CODENAME') {
               osInfo.VERSION_CODENAME = trimmedValue
            }
         }
      });

      // capitalize distroId
      osInfo.ID = osInfo.ID[0].toUpperCase() + osInfo.ID.slice(1).toLowerCase()
      osInfo.VERSION_CODENAME = osInfo.VERSION_CODENAME.toLowerCase()

      return osInfo
   }

   /* Funzione helper che crea una pausa non bloccante.
   * @param ms Millisecondi da attendere
   */
   static sleep(ms: number = 60000): Promise<void> {
      // console.log('wait...')
      return new Promise(resolve => setTimeout(resolve, ms));
   }

   /**
    * chpasswdPath
    * @returns 
    */
   static chpasswdPath() {
      let chpasswdPath = '/usr/sbin/chpasswd'
      if (fs.existsSync(chpasswdPath)) {
         chpasswdPath = '/usr/bin/chpasswd'
      }
      return chpasswdPath
   }

}