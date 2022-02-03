/**
 * penguins-eggs-v9
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'

import fs = require('fs')
import path = require('path')
import Utils from '../classes/utils'
import { exec } from '../lib/utils'
// backup
import { access } from 'fs/promises'
import { constants } from 'fs'
import Users from '../classes/users'

export default class Syncto extends Command {
    luksName = 'luks-eggs-backup'
    luksFile = `/run/live/medium/live/${this.luksName}`
    luksDevice = `/dev/mapper/${this.luksName}`
    luksMountpoint = '/tmp/eggs-backup'

    static description = 'Backup users, server and datas to luks-eggs-backup'

    static flags = {
        krill: Flags.boolean({ char: 'k', description: 'krill' }),
        file: Flags.string({ char: 'f', description: "file LUKS volume encrypted" }),
        help: Flags.help({ char: 'h' }),
        verbose: Flags.boolean({ char: 'v', description: 'verbose' })
    }

    static examples = ['$ sudo eggs restore']

    /**
     * 
     */
    async run(): Promise<void> {

        const { flags } = await this.parse(Syncto)
        let verbose = false
        if (flags.verbose) {
            verbose = true
        }

        let fileVolume = ''
        if (flags.file) {
            fileVolume = flags.file
        }

        const echo = Utils.setEcho(verbose)
        if (Utils.isRoot(this.id)) {
            /**
             * restore con file
             */
            if (fileVolume === '') {
                fileVolume = '/tmp/luks-eggs-backup'
            }

            this.luksName = path.basename(fileVolume)
            this.luksFile = fileVolume
            this.luksDevice = `/dev/mapper/${this.luksName}`
            this.luksMountpoint = '/tmp/eggs-backup'
            if (!fs.existsSync(fileVolume)) {
                await this.luksCreate(verbose)
            } else {
                Utils.warning(`LUKS volume: ${this.luksFile} exist, don't need create`)
            }
            if (fs.existsSync(fileVolume)) {
                await this.luksOpen(verbose)
                await this.backup(verbose)
                await this.luksClose(verbose)
            }
        }
    }



    /**
     *
     * @param verbose
     */
    async backup(verbose = false) {
        const echo = Utils.setEcho(verbose)
        if (verbose) {
            Utils.warning('backup')
        }
        const usersArray = await this.usersFill()
        const cmds: string[] = []
        for (let i = 0; i < usersArray.length; i++) {
            if (usersArray[i].saveIt) {
                if (fs.existsSync(usersArray[i].home)) {
                    await exec(`mkdir -p ${this.luksMountpoint}/ROOT${usersArray[i].home}`, echo)
                    const source = usersArray[i].home
                    let dest = this.luksMountpoint + '/ROOT' + usersArray[i].home
                    dest = dest.substring(0, dest.lastIndexOf('/'))
                    await exec(`rsync --archive ${source} ${dest}`, echo)
                }
            }
        }
        await exec(`mkdir -p ${this.luksMountpoint}/etc`, echo)
        await exec(`cp /etc/passwd ${this.luksMountpoint}/etc`, echo)
        await exec(`cp /etc/shadow ${this.luksMountpoint}/etc`, echo)
        await exec(`cp /etc/group ${this.luksMountpoint}/etc`, echo)
    }


    /**
    * usersFill
    */
    async usersFill(): Promise<Users[]> {
        const usersArray = []
        await access('/etc/passwd', constants.R_OK | constants.W_OK);
        const passwd = fs.readFileSync('/etc/passwd', 'utf-8').split('\n')
        for (let i = 0; i < passwd.length; i++) {
            var line = passwd[i].split(':')
            const users = new Users(line[0], line[1], line[2], line[3], line[4], line[5], line[6])
            await users.getValues()
            if (users.password !== undefined) {
                usersArray.push(users)
            }
        }
        return usersArray
    }


    /**
     * 
     */
    async luksCreate(verbose = false) {
        const echo = Utils.setEcho(verbose)
        const echoYes = Utils.setEcho(true)

        Utils.warning(`Creating LUKS Volume on ${this.luksFile}`)

        let totalSize = 0
        console.log(`I will extimate volume size from your private data:`)
        const users = await this.usersFill()
        for (let i = 0; i < users.length; i++) {
            if (users[i].login !== 'root') {
                if (users[i].saveIt) {
                    console.log(`user: ${users[i].login} \thome: ${users[i].home.padEnd(16)} \tsize: ${Utils.formatBytes(users[i].size)} \tBytes: ${users[i].size} `)
                    totalSize += users[i].size
                }
            }
        }
        console.log(`Total\t\t\t\t\tSize: ${Utils.formatBytes(totalSize)} \tBytes: ${totalSize}`)

        /**
         * after we get size, we can start building luks-volume
         */
        const binaryHeaderSize = 4194304
        let volumeSize = totalSize * 1.2 + binaryHeaderSize

        // Deciding blockSize and blocks
        let blockSize = 1024
        let blocks = Math.ceil(volumeSize / blockSize)

        // We need a minimum size of 32 MB
        let minimunSize = 134217728 // 128 * 1024 *1024
        if (totalSize < minimunSize) {
        }
        if (blocks * blockSize < minimunSize) {
            blocks = Math.ceil(minimunSize / blockSize)
        }

        Utils.warning(`Creating an encrypted file ${this.luksFile} blocks=${blocks}, block size: ${blockSize}, size: ${Utils.formatBytes(blocks * blockSize)}`)
        await exec(`dd if=/dev/zero of=${this.luksFile} bs=${blockSize} count=${blocks}`, echo)

        // find first unused device
        let findFirstUnusedDevice = await exec(`losetup -f`, { echo: verbose, ignore: false, capture: true })
        let firstUnusedDevice = ''
        if (findFirstUnusedDevice.code !== 0) {
            Utils.warning(`Error: ${findFirstUnusedDevice.code} ${findFirstUnusedDevice.data}`)
            process.exit(1)
        } else {
            firstUnusedDevice = findFirstUnusedDevice.data.trim()
        }
        await exec(`losetup ${firstUnusedDevice} ${this.luksFile}`, echo)

        Utils.warning('Enter a large string of random text below to setup the pre-encryption')
        await exec(`cryptsetup -y -v --type luks2 luksFormat  ${this.luksFile}`, echoYes)

        Utils.warning(`Enter the desired passphrase for the encrypted ${this.luksName} below`)
        let crytoSetup = await exec(`cryptsetup luksOpen --type luks2 ${this.luksFile} ${this.luksName}`, echoYes)
        if (crytoSetup.code !== 0) {
            Utils.warning(`Error: ${crytoSetup.code} ${crytoSetup.data}`)
            process.exit(1)
        }

        Utils.warning(`Formatting ${this.luksDevice} to ext2`)
        let formatting = await exec(`sudo mkfs.ext2 ${this.luksDevice}`, echo)
        if (formatting.code !== 0) {
            Utils.warning(`Error: ${formatting.code} ${formatting.data}`)
            process.exit(1)
        }
        this.luksClose()
    }


    /**
     * 
     */
    async luksOpen(verbose = false) {
        const echo = Utils.setEcho(verbose)
        const echoYes = Utils.setEcho(true)

        Utils.warning(`LUKS open volume: ${this.luksName}`)
        await exec(`cryptsetup luksOpen --type luks2 ${this.luksFile} ${this.luksName}`, echoYes)

        Utils.warning(`mount volume: ${this.luksDevice} on ${this.luksMountpoint}`)
        if (!fs.existsSync(this.luksMountpoint)) {
            await exec (`mkdir -p ${this.luksMountpoint}`)
        }
        await exec(`mount ${this.luksDevice} ${this.luksMountpoint}`, echoYes)

    }


    /**
    * 
    */
    async luksClose(verbose = false) {
        const echo = Utils.setEcho(verbose)

        Utils.warning(`LUKS close volume: ${this.luksName}`)
        await exec(`cryptsetup luksClose ${this.luksName}`, echo)
    }

}




