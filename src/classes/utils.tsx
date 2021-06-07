/* eslint-disable valid-jsdoc */
/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import React from 'react';
import { render, Box, Text } from 'ink'
import Title from '../components/elements/title'

import shx = require('shelljs')
import fs = require('fs')
import dns = require('dns')
import path = require('path')
import os = require('os')
import pjson = require('pjson')
import inquirer = require('inquirer')
import chalk = require('chalk')
import Pacman from './pacman'

import clear = require('clear')
import figlet = require('figlet')

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Utils {

   /**
    * Restituisce il prefisso della iso
    * @param distroId 
    * @param versionId 
    */
   static snapshotPrefix(distroId: string, versionId: string): string {
      let result = 'egg-of-' + distroId.toLowerCase() + '-' + versionId.toLowerCase() + '-'
      result = result.replace(`/`, '-')
      return result
   }

   /**
   * Controlla se il sistema è avviato con systemd
   * funziona anche in MX che utilizza systemd
   * ma viene avviato con init
   */
   static isSystemd(): boolean {
      // return (shx.exec(`pidof systemd`).stdout.trim() === '1')
      return (shx.exec(`ps -p 1 -o comm=`).stdout.trim() === 'systemd')
   }

   /**
    * ricava path per vmlinuz
    */
   static vmlinuz(): string {
      const results = fs.readFileSync('/proc/cmdline', 'utf8').split(' ')
      let result = results[0]
      result = result.substring(result.indexOf('=') + 1)
      if (result.indexOf('@') > 0) {
         result = result.substring(result.indexOf('@') + 1)
      }
      return result
   }

   /**
    * ricava path per initrdImg
    */
   static initrdImg(): string {
      const vmlinuz = Utils.vmlinuz()
      const path = vmlinuz.substring(0, vmlinuz.lastIndexOf('/')) + '/'
      const version = vmlinuz.substring(vmlinuz.indexOf('-'))
      return path + 'initrd.img' + version
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

      console.log(pjson.shortName + ' >>> ' + chalk.bgGrey(msg) + '.')
   }

   /**
    * Return the primary user's name
    */
   static getPrimaryUser(): string {
      // let primaryUser = shx.exec(`echo $(awk -F":" '/1000:1000/ { print $1 }' /etc/passwd)`, { silent: true }).stdout.trim()
      const primaryUser = shx.exec('echo $SUDO_USER', { silent: true }).stdout.trim()
      if (primaryUser === '') {
         console.log('Cannot find your user name. Log as normal user and run: $sudo eggs [COMMAND]')
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
         const list = fs.readdirSync(snapshot_dir)
         if (list.length > 0) {
            return list.length - 1
         }
      }
      return 0
   }

   /**
    * Get the syze of the snapshot
    * @returns {string} grandezza dello snapshot in Byte
    */
   static getSnapshotSize(snapshot_dir = '/'): number {
      let fileSizeInBytes = 0
      const size = shx.exec(`/usr/bin/find /home/eggs -maxdepth 1 -type f -name '*.iso' -exec du -sc {} + | tail -1 | awk '{print $1}'`, { silent: true }).stdout.trim()

      if (size === '') {
         fileSizeInBytes = 0
      } else {
         fileSizeInBytes = Number(size)
      }
      return fileSizeInBytes
   }

   /**
    * debArch
    * Node process.arch -> Debian arch
    * @returns arch
    */
    static machineArch(): string {
      let arch = ''
      if (process.arch === 'x64') {
         arch = 'amd64'
      } else if (process.arch === 'ia32') {
         arch = 'i386'
         // ma, se è installato node386 come in rasberry-desktop...
         if (shx.exec('uname -m', {silent: true}).stdout.trim() === 'x86_64') {
            arch = 'amd64'
         }
      } else if (process.arch === 'arm64') {
         arch = 'arm64'
      } else if (process.arch === 'arm') {
         arch = 'armel'
      }
      return arch
   }

   /**
    * eggsArch 
    * @returns 
    */
   static eggsArch(): string {
      let arch = ''
      if (process.arch === 'x64') {
         arch = 'amd64'
      } else if (process.arch === 'ia32') {
         arch = 'i386'
      } else if (process.arch === 'arm64') {
         arch = 'arm64'
      } else if (process.arch === 'arm') {
         arch = 'armel'
      }
      return arch
   }
   /**
    * Return the eggName with architecture and date
    * @param basename
    * @returns eggName
    */
   static getFilename(basename = ''): string {

      let isoName = `${basename}-${this.machineArch()}_${Utils.formatDate(new Date())}`
      if (isoName.length >= 28) {
         isoName = isoName.substr(0, 28) // 28 +  4 .iso = 32 lunghezza max di volid
      }
      return `${isoName}.iso`
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
    * Check se la macchina ha grub adatto ad efi
    */
   static isUefi(): boolean {
      let isUefi = false
      if (Utils.machineArch() !== 'i386') {
         if (Pacman.packageIsInstalled('grub-efi-' + Utils.machineArch() + '-bin')) {
            isUefi = true
         }
      }
      return isUefi
   }

   /**
    * Controlla se è un pacchetto deb
    */
   static isDebPackage(): boolean {
      let ret = false
      if (process.execPath !== '/usr/bin/node') {
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
    * @remarks to move in Utils
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
         '/live/aufs' // mx-linux
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
      } else {
         Utils.titles(pjson.shortName + ' ' + command + ` need to run with root privileges. Please, prefix it with sudo`)
      }
      return false
   }

   /**
    * get the kernel version
    */
   static kernerlVersion(): string {
      return os.release()
   }

   /**
    * return the name of network device
    */
   static netDeviceName(): string {
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
    * todo
    */
   static netAddress(): string {
      const { networkInterfaces } = require('os')

      const nets = networkInterfaces();
      const results = Object.create(null); // or just '{}', an empty object

      let address = ''
      for (const name of Object.keys(nets)) {
         for (const net of nets[name]) {
            // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
               if (!results[name]) {
                  results[name] = [];
               }
               results[name].push(net.address)
               address = net.address
            }
         }
      }
      return address
   }

   /**
    * todo
    */
   static netMasK(): string {
      const { networkInterfaces } = require('os')

      const nets = networkInterfaces();
      const results = Object.create(null); // or just '{}', an empty object

      let netmask = ''
      for (const name of Object.keys(nets)) {
         for (const net of nets[name]) {
            // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
               if (!results[name]) {
                  results[name] = [];
               }
               results[name].push(net.address)
               netmask = net.netmask
            }
         }
      }
      return netmask
   }

   /**
    * @returns dns
    */
   static netDns(): string[] {
      return dns.getServers()
   }

   /**
    * @returns gateway
    */
   static netGateway(): string {
      const cmd = `traceroute -m1 -n 8.8.8.8| grep ms| awk '{print $2}'`
      const gw = shx.exec(cmd, { silent: true }).stdout.trim()
      return gw
   }

   /**
    * userAdd
    * @param target
    * @param username
    * @param password
    * @param fullName
    */
   static userAdd(target = '/TARGET', username = 'live', password = 'evolution', fullName = '') {
      const cmd = `sudo chroot ${target} adduser ${username}\
                    --home /home/${username} \
                    --shell /bin/bash \
                    --disabled-password \
                    --gecos ${fullName},\
                            '',\
                            '',\
                            ''`

      console.log(`addUser: ${cmd}`)
      shx.exec(cmd)

      const cmdPass = `echo ${username}:${password} | chroot ${target} chpasswd `
      console.log(`addUser cmdPass: ${cmdPass}`)
      shx.exec(cmdPass)

      const cmdSudo = `chroot ${target} addgroup ${username} sudo`
      console.log(`addUser cmdSudo: ${cmdSudo}`)
      shx.exec(cmdSudo, { silent: true })
   }

   /**
    * Return an array of the users of the system
    * @remarks to move in Utils
    * @returns {string[]} array di utenti
    */
   static usersList(): string[] {
      const out = shx.exec('/usr/bin/lslogins --noheadings -u -o user | grep -vw root', { silent: true }).stdout
      const users: string[] = out.split('\n')
      return users
   }

   /**
    * Create folder
    * @param dir
    * @param varius {recursive: true/false}
    */
   static shxMkDir(dir = '', varius: any): void {
      if (varius.recursive) {
         shx.mkdir('-p', dir)
      } else {
         shx.mkdir(dir)
      }
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

         inquirer.prompt(questions).then(function (options) {
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

         inquirer.prompt(questions).then(function (options) {
            resolve(JSON.stringify(options))
         })
      })
   }

   /**
    * titles
    * Penguin's are gettings alive!
    */
   static async titles(command = ''): Promise<void> {
      console.clear()
      console.log(figlet.textSync('eggs'))
      console.log(chalk.bgGreen.whiteBright('      ' + pjson.name + '      ') +
         chalk.bgWhite.blue(" Perri's Brewery edition ") +
         chalk.bgRed.whiteBright('       ver. ' + pjson.version + '       '))
      console.log('command: ' + chalk.bgBlack.white(command) + '\n')
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
}
