/**
 * User
 */
import fs from 'fs'
import { exec } from '../lib/utils'

/**
 * 
 */
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
         * /dev, /proc, /run, /sys, /tmp
         * are excluded to be save
         */
        if (this.home != undefined) {
            if (this.home.substring(0, 4) === '/dev/' ||
            this.home.substring(0, 5) === '/proc/' ||
            this.home.substring(0, 4) === '/run/' ||
            this.home.substring(0, 4) === '/sys/' ||
            this.home.substring(0, 4) === '/tmp/') {
                size = 0
            } else {
                switch (this.home) {
                    case '/':
                    case '/root':
                    case '/not/existent': {
                        size = 0
                        break
                    }
                    /**
                     * under /usr
                     */
                    case '/usr/bin':
                    case '/usr/sbin': {
                        size = 0
                        break
                    }

                    /** 
                     * under var
                     */
                    case '/var/backups':
                    case '/var/lib/colord':
                    case '/var/lib/geoclue':
                    case '/var/lib/misc':
                    case '/var/mail': {
                        size = 0
                        break
                    }

                    default: {
                        saveIt = true
                        break
                    }
                }
            }
            this.saveIt = saveIt
            this.size = size
            this.hasHome = hasHome
}
    }
}
