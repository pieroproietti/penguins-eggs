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

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
  */
export default class Utils {

  /**
   * prerequisistesInstalled
   */
  static prerequisitesInstalled(): boolean {
    const retVal : boolean = fs.existsSync('/etc/penguins-eggs.conf') && (fs.existsSync('//usr/local/share/excludes/penguins-eggs-exclude.list'))
    if (retVal){
      console.log('You need to install the prerequisites for eggs. \nTry: sudo eggs prerequisites')
    }
    return retVal
  }

  /**
   * Return the primary user's name
   */
  static getPrimaryUser(): string {
    return shx.exec(`echo $(awk -F":" '/1000:1000/ { print $1 }' /etc/passwd)`).stdout.trim()
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
  * return the name of the package: penguins-eggs-v8
  * @returns penguins-eggs-v8
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
      return list.length
    }
    return 0
  }

  /**
   * Get the syze of the snapshot
   * @returns {string} grandezza dello snapshot in Byte
   */
  static getSnapshotSize(snapshot_dir = '/'): string {
    let size = ''
    if (fs.existsSync(snapshot_dir)) {
      size = Utils.shxExec(`/usr/bin/find ${snapshot_dir} -maxdepth 1 -type f -name '*.iso' -exec du -shc {} + | tail -1 | awk '{print $1}'`).stdout.trim()
    }
    if (size === '') {
      size = '0'
    }
    return size
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
    return ''
  }

  /**
     * Return the Debian version
     * @remarks to move in Utils
     * @returns {number} Versione di Debian
     */
  static getDebianVersion(): number {
    const cmd = 'cat /etc/debian_version | /usr/bin/cut -f1 -d\'.\''
    const version = Number(shx.exec(cmd).stdout)
    return version
  }

  /**
       * Calculate the space used on the disk
       * @return {void}
       */
  static getUsedSpace(): string {
    let out = ''
    if (this.isLive()) {
      out += `${this.getLiveRootSpace()} GB -- estimated`
    } else {
      out += shx.exec('df -h / | /usr/bin/awk \'NR==2 {print $3}\'').stdout
    }

    if (shx.exec('mountpoint -q /home').code) {
      out += 'Used space on /home: ' + shx.exec('df -h /home | /usr/bin/awk \'NR==2 {print $3}\'').stdout
    }
    return out
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
    if (shx.exec('uname -m').stdout.trim() === 'i686') {
      retVal = true
    }
    return retVal
  }

  /**
     * Return true if live system - Versione Debian Live
     * @remarks to move in Utils
     * @returns {boolean} isLive
     */
  static isLive(type = 'debian-live'): boolean {
    let retVal = false
    let result = 1
    let cmd = 'mountpoint -q /lib/live/mount/'
    if (type === 'mx') {
      cmd = 'mountpoint -q /live/aufs'
    }
    result = shx.exec(cmd).code
    retVal = result === 0
    return retVal
  }

  /**
    * return true if eggs run as root
    * @returns isRoot
    */
  static isRoot(): boolean {
    if (process.getuid && process.getuid() === 0) {
      return true
    }
    console.log(`${this.getFriendName()} need to run with root privileges. Please, prefix it with sudo.`)
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
     * Check if the package debPackage is already unstalled
     * @param debPackage {string} Pacchetto Debian  da cercare
     * @returns {boolean} True if installed
     */
  static packageIsInstalled(debPackage: string): boolean {
    const cmd = `/usr/bin/dpkg -s ${debPackage} | grep Status`
    const stdout = Utils.shxExec(cmd).stdout
    let isInstalled = false

    if (stdout.trim() === 'Status: install ok installed') {
      isInstalled = true
    }
    return isInstalled
  }

  /**
       * Install the package debPackage
       * @param debPackage {string} Pacchetto Debian da installare
       * @returns {boolean} True if success
       */
  static packageInstall(debPackage: string): boolean {
    let retVal = false

    if (Utils.shxExec('/usr/bin/apt-get update') === '0') {
      if (Utils.shxExec(`/usr/bin/apt-get install -y ${debPackage}`) === '0') {
        retVal = true
      }
    }
    return retVal
  }

  /**
    * Display comand
    * @param cmd
    */
  static showCmd(cmd: string) {
    console.log(cmd)
  }

  /**
  * Execute and show cmd
  * @param cmd
  * @param silent
  */
  static shxExec(cmd: string, silent: object = { silent: false }): any {
    this.showCmd(cmd)
    return shx.exec(cmd, silent)
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
    shx.exec(cmdSudo)
  }

  /**
       * Return an array of the users of the system
       * @remarks to move in Utils
       * @returns {string[]} array di utenti
       */
  static usersList(): string[] {
    const out = Utils.shxExec('/usr/bin/lslogins --noheadings -u -o user | grep -vw root').stdout
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
    console.log(`[utils]\n>>> Creazione ${file}`)
    text = text.trim() + '\n'
    text = text.trim() + '\n'
    file = file.trim()
    fs.writeFileSync(file, text)
    console.log(text)
    console.log(`>>> Fine creazione ${file}  ===`)
  }
}
