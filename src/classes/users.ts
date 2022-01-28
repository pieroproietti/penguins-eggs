/**
 * User
 */

import fs from 'fs'
import { exec } from '../lib/utils'


export default class Users {
    public login: string
    public password: string
    public uid: string
    public gid: string
    public gecos: string
    public home: string
    public shell: string
    public size: number
    public hasHome: boolean
    public saveIt: boolean

    constructor(login: string, password: string, uid: string, gid: string, gecos: string, home: string, shell: string) {
        this.login = login
        this.password = password
        this.uid = uid
        this.gid = gid
        this.gecos = gecos
        this.home = home
        this.shell = shell
        this.size = 0
        this.hasHome = false
        this.saveIt = false
    }

    /**
    * getSize
    * @param verbose
    */
    async getValues() {
        let hasHome = false
        let saveIt = false
        let size = 0

        if (fs.existsSync(this.home)) {
            hasHome = true
            const sizeUser = await exec(` du --block-size=1 --summarize ${this.home} | awk '{print $1}'`, { echo: false, ignore: false, capture: true })
            size = Number.parseInt(sizeUser.data)
        }

        /**
         * 
         */
        switch (this.home) {
            case '/':
            case '/bin':
            case '/dev':
            case '/var/backups':
            case '/run/systemd':
            case '/run/uuidd':
            case '/proc':
            case '/run/avahi-daemon':
            case '/usr/bin':
            case '/usr/sbin':
            case '/var/lib/colord':
            case '/var/lib/geoclue':
            case '/var/lib/misc':
            case '/nonexistent':
            case '/run':
            case '/var/mail': {
                size = 0
                break
            }
            default: {
                saveIt = true
            }
                this.saveIt = saveIt
                this.size = size
                this.hasHome = hasHome

        }
    }
}
