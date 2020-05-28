/* eslint-disable valid-jsdoc */
/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import shx = require('shelljs')
import fs = require('fs')
import os = require('os')
import ini = require('ini')
import pjson = require('pjson')
import inquirer = require('inquirer')
import chalk = require('chalk')
import clear = require('clear')
import figlet = require('figlet')

import Pacman from './pacman'

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Utils {

  /**
   * 
   * @param msg 
   */
  static warning(msg = '') {
    console.log('eggs >>> ' + chalk.cyanBright(msg) + '.')
  }

  static error(msg = '') {
    console.log('eggs >>> ' + chalk.bgGrey(msg) + '.')
  }

  /**
   * Return the primary user's name
   */
  static getPrimaryUser(): string {
    // let primaryUser =shx.exec(`echo $(awk -F":" '/1000:1000/ { print $1 }' /etc/passwd)`, { silent: true }).stdout.trim()
    let primaryUser = shx.exec('echo $SUDO_USER', { silent: true }).stdout.trim()
    if (primaryUser === '') {
      console.log('Cannot find your user name. Log as normal user and run: $sudo eggs produce ')
      process.exit(1)
      primaryUser = 'live'
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
    return pjson.name
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
  * Calculate the space used on the disk
  * @return {void}
  */
  static getUsedSpace(): number {
    let fileSizeInBytes = 0
    if (this.isLive()) {
      fileSizeInBytes = this.getLiveRootSpace()
    } else {
      fileSizeInBytes = Number(shx.exec(`df /home | /usr/bin/awk 'NR==2 {print $3}'`, { silent: true }).stdout)
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

    /**
       * root-space-needed is the size of the linuxfs file * a compression factor +
       * contents of the rootfs. Conservative but fast factors are same as used in
       * live-remaster
       */
    const sqfile_full = ini.parse(fs.readFileSync(squashFs, 'utf-8'))

    // get compression factor by reading the linuxfs squasfs file, if available
    const linuxfs_compression_type = shx.exec(`dd if=${sqfile_full} bs=1 skip=20 count=2 status=none 2>/dev/null| /usr/bin/od -An -tdI`)

    let compression_factor = 0

    if (linuxfs_compression_type === '1') {
      compression_factor = 37 // gzip
    } else if (linuxfs_compression_type === '2') {
      compression_factor = 52 // lzo, not used by antiX
    } else if (linuxfs_compression_type === '3') {
      compression_factor = 52  // lzma, not used by antiX
    } else if (linuxfs_compression_type === '4') {
      compression_factor = 31 // xz
    } else if (linuxfs_compression_type === '5') {
      compression_factor = 52 // lz4
    } else {
      compression_factor = 30 // anything else or linuxfs not reachable (toram), should be pretty conservative
    }
    let rootfs_file_size = 0
    const linuxfs_file_size = Number(shx.exec('df /live/linux --output=used --total | /usr/bin/tail -n1').stdout.trim()) * 1024 * 100 / compression_factor

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
    let retVal = false
    if (shx.exec('uname -m', { silent: true }).stdout.trim() === 'i686') {
      retVal = true
    }
    return retVal
  }


  /**
   * return the short name of the package: eggs
   * @returns eggs
   */
  static getFriendName(): string {
    return 'eggs'
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
    const cmd = 'cat /etc/debian_version | /usr/bin/cut -f1 -d\'.\''
    const version = Number(shx.exec(cmd, { silent: true }).stdout)
    return version
  }

  /**
     * Return true if live system - Versione Debian Live
     * @remarks to move in Utils
     * @returns {boolean} isLive
     */
  static isLive(type = 'debian-live'): boolean {
    let retVal = false

    // debian-live
    let path = '/lib/live/mount'
    if (Utils.isMountpoint(path)){
      retVal = true
    }

    // Ubuntu bionic
    path = '/lib/live/mount/rootfs/filesystem.squashfs'
    if (Utils.isMountpoint(path)){
      retVal = true
    }

    // MX Linux
    path = '/live/aufs'
    if (Utils.isMountpoint(path)){
      retVal = true
    }

    return retVal
  }

  /**
   * Ritorna vero se path è un mountpoint
   * @param path 
   */
  static isMountpoint(path = ''): boolean {
    let result: number
    let cmd = `mountpoint -q ${path}`
    // return 0 if the directory is a mountpoint, non-zero if not.
    result = shx.exec(cmd, { silent: true }).code
    return (result === 0)
  }

  /**
    * return true if eggs run as root
    * @returns isRoot
    */
  static isRoot(): boolean {
    if (process.getuid && process.getuid() === 0) {
      return true
    }
    Utils.warning(`${Utils.getFriendName()} need to run with root privileges. Please, prefix it with sudo`)
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
   * @returns dns
   */
  static netDns(): string {
    return '192.168.61.1'
  }

  /**
   * @returns gateway
   */
  static netGateway(): string {
    return '192.168.61.1'
  }

  /**
   * userAdd
   * @param target
   * @param username
   * @param password
   * @param fullName
   */
  static userAdd(target = '/TARGET',
    username = 'live',
    password = 'evolution',
    fullName = '') {
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

  static write(file: string, text: string): void {
    text = text.trim() + '\n'
    text = text.trim() + '\n'
    file = file.trim()
    fs.writeFileSync(file, text)
  }

  /**
  *
  * @param msg
  */
  static async customConfirm(msg = "Select yes to continue... "): Promise<boolean> {
    let varResult = await Utils.customConfirmCompanion(msg)
    let result = JSON.parse(varResult)
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
  static async customConfirmCompanion(msg = "Select yes to continue... "): Promise<any> {
    return new Promise(function (resolve) {
      const questions: Array<Record<string, any>> = [
        {
          type: 'list',
          name: 'confirm',
          message: msg,
          choices: ['No', 'Yes'],
          default: 'No',
        },
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
  static titles(command = ''): void {
    clear()
    console.log(chalk.blue(figlet.textSync('eggs')))
    console.log(chalk.bgGreen.white('   ' + pjson.name+ '   ') + chalk.bgWhite.blue(' Perri\'s Brewery edition ') + chalk.bgRed.whiteBright('    ver. ' + pjson.version + '   '))
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
