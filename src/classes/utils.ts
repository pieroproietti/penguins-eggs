/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import fs = require('fs')
import shx = require('shelljs')
import pjson = require('pjson')

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
  */
export default class Utils {

    /**
   * Return true if live system
   * @remarks to move in Utils
   * @returns {boolean} isLive
   */
  static isLive(): boolean {
    let retVal = false
    let result : number = 1
    result = shx.exec(`mountpoint -q /live/aufs`).code
    retVal =  result === 0
    return retVal
  }

  /**
  * return the name of the package: penguins-eggs-v8
  * @returns penguins-eggs-v8
  */
  static getPackageName(): string {
    return pjson.name
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
   *
   */
  static getAuthorName(): string {
    return ''
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
    *
    * @param newDir
    */
  static processChDir(newDir: string): void {
    const currentDir = process.cwd()
    process.chdir(newDir)
    console.log(`>>>>> current dir: ${currentDir}, changed to: ${process.cwd()} <<<<<`)
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
    * Display
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
  static shxExec(cmd: string, silent: object = {silent: false}): any {
    this.showCmd(cmd)
    return shx.exec(cmd, silent)
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

  /**
   * Check if the package debPackage is already unstalled
   * @param debPackage {string} Pacchetto Debian  da cercare
   * @returns {boolean} True if installed
   */
  static checkInstalled(debPackage: string): boolean {
    const cmd = `/usr/bin/dpkg -s ${debPackage} | grep Status`
    const stdout = shx.exec(cmd).stdout
    let isInstalled = false

    if (stdout.trim() === 'Status: install ok installed') {
      isInstalled = true
    }
    return isInstalled
  }

  /**
   * addUser
   * @param target
   * @param username
   * @param password
   * @param fullName
   */
  static addUser(target = '/TARGET',
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
   * netDns
   */
  static netDns(): string {
    return '192.168.61.1'    
  }

  /**
   * netGateway
   */
  static  netGateway(): string {
    return '192.168.61.1'
  }
}

