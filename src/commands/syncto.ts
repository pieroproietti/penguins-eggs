/**
 * penguins-eggs-v9
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

/**
 *
 * syncfrom (restore)
 * --include-from file.list // if only include is provided everything from the list if used to update the system.
 * --exclude-from file-list // it just updates the system
 * --delete
 *
* If both options are provided then it works as a combination as provided in the link above.
* https://stackoverflow.com/questions/19296190/rsync-include-from-vs-exclude-from-what-is-the-actual-difference
*
 * The same logic is applied for the syncto also.
 *
 * On top of all of this the --delete option
 * if needed to be passed so that everything else is removed, but this
 * this should not be available by default
 */
import { Command, Flags } from '@oclif/core'
import fs from 'fs'
import path from 'path'
import Utils from '../classes/utils'
import { exec } from '../lib/utils'

// backup
import { access } from 'fs/promises'
import { constants } from 'fs'
import Users from '../classes/users'
import { use } from 'chai'

/**
 *
 */
export default class Syncto extends Command {

    verbose = false

    echo = {}

    luksName = 'luks-eggs-backup'

    luksFile = `/run/live/medium/live/${this.luksName}`

    luksDevice = `/dev/mapper/${this.luksName}`

    luksMountpoint = '/tmp/eggs-backup'

    static description = `saves users and user data in a LUKS volume inside the iso`

    static flags = {
        delete: Flags.string({ description: 'rsync --delete delete extraneous files from dest dirs' }),
        file: Flags.string({ char: 'f', description: "file LUKS volume encrypted" }),
        help: Flags.help({ char: 'h' }),
        verbose: Flags.boolean({ char: 'v', description: 'verbose' })
    }

    // static aliases = ['backup']

    static examples = ['$ sudo eggs syncto']

    /**
     *
     */
    async run(): Promise<void> {

        const { flags } = await this.parse(Syncto)

        if (flags.verbose) {
            this.verbose = true
        }
        this.echo = Utils.setEcho(this.verbose)

        let fileVolume = ''
        if (flags.file) {
            fileVolume = flags.file
        }

        let destDelete = false
        if (flags.delete) {
            destDelete = true
        }

        if (Utils.isRoot()) {
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
                await this.luksCreate()
            } else {
                Utils.warning(`LUKS volume: ${this.luksFile} exist, don't need create`)
            }
            if (fs.existsSync(fileVolume)) {
                await this.luksOpen()
                await this.backup(destDelete)
                await this.luksClose()
            }
        } else {
            Utils.useRoot(this.id)
        }
    }


    /**
     *
     */
    async backup(destDelete = false) {
        if (this.verbose) {
            Utils.warning('backup')
        }
        Utils.warning(`Saving users' data on ${this.luksFile}`)
        const usersArray = await this.usersFill()
        for (let i = 0; i < usersArray.length; i++) {
            if (usersArray[i].saveIt) {
                if (fs.existsSync(usersArray[i].home)) {
                    await exec(`mkdir -p ${this.luksMountpoint}/ROOT${usersArray[i].home}`, this.echo)
                    const source = usersArray[i].home
                    let dest = this.luksMountpoint + '/ROOT' + usersArray[i].home
                    dest = dest.substring(0, dest.lastIndexOf('/'))
                    let cmd = `rsync --archive ${source} ${dest}`
                    if (destDelete) {
                        cmd = `rsync --archive --delete ${source} ${dest}`
                    }
                    await exec(cmd, this.echo)
                }
            }
        }
        Utils.warning(`Saving users' accounts on ${this.luksFile}`)
        await exec(`mkdir -p ${this.luksMountpoint}/etc`, this.echo)
        await exec(`cp /etc/passwd ${this.luksMountpoint}/etc`, this.echo)
        await exec(`cp /etc/shadow ${this.luksMountpoint}/etc`, this.echo)
        await exec(`cp /etc/group ${this.luksMountpoint}/etc`, this.echo)
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
    async luksCreate() {
        Utils.warning(`Creating LUKS Volume on ${this.luksFile}`)

        let totalSize = 0
        console.log(`I will extimate volume size from your private data:`)
        const users = await this.usersFill()
        for (let i = 0; i < users.length; i++) {
            if (users[i].login !== 'root') {
                if (users[i].saveIt) {
                    let utype = 'user   '
                    if (parseInt(users[i].uid) < 1000) {
                        utype = 'service'
                    }
                    console.log(`- ${utype}: ${users[i].login.padEnd(16)} \thome: ${users[i].home} \tsize: ${Utils.formatBytes(users[i].size)} \tBytes: ${users[i].size} `)
                    totalSize += users[i].size
                }
            }
        }
        console.log(`Total\t\t\t\t\t\t\tsize: ${Utils.formatBytes(totalSize)} \tBytes: ${totalSize}`)

        /**
         * after we get size, we can start building luks-volume
         */
        const binaryHeaderSize = 4194304
        let volumeSize = totalSize * 1.5 + binaryHeaderSize

        // Deciding blockSize and blocks
        let blockSize = 512
        let blocks = Math.ceil(volumeSize / blockSize)

        // We need a minimum size of 32 MB
        let minimunSize = 134217728 // 128 * 1024 *1024
        if (totalSize < minimunSize) {
        }
        if (blocks * blockSize < minimunSize) {
            blocks = Math.ceil(minimunSize / blockSize)
        }

        Utils.warning(`Creating an encrypted file ${this.luksFile} blocks=${blocks}, block size: ${blockSize}, size: ${Utils.formatBytes(blocks * blockSize)}`)
        await exec(`dd if=/dev/zero of=${this.luksFile} bs=${blockSize} count=${blocks}`, this.echo)

        // find first unused device
        let findFirstUnusedDevice = await exec(`losetup -f`, { echo: this.verbose, ignore: false, capture: true })
        let firstUnusedDevice = ''
        if (findFirstUnusedDevice.code !== 0) {
            Utils.pressKeyToExit(`Error: ${findFirstUnusedDevice.code} ${findFirstUnusedDevice.data}`)
        } else {
            firstUnusedDevice = findFirstUnusedDevice.data.trim()
        }
        await exec(`losetup ${firstUnusedDevice} ${this.luksFile}`, this.echo)

        // Utils.warning('Enter a large string of random text below to setup the pre-encryption')
        await exec(`cryptsetup -y -v --type luks2 luksFormat  ${this.luksFile}`, Utils.setEcho(true))

        // Utils.warning(`Enter the desired passphrase for the encrypted ${this.luksName} below`)
        let crytoSetup = await exec(`cryptsetup luksOpen --type luks2 ${this.luksFile} ${this.luksName}`, Utils.setEcho(true))
        if (crytoSetup.code !== 0) {
            Utils.pressKeyToExit(`Error: ${crytoSetup.code} ${crytoSetup.data}`)
        }

        Utils.warning(`Formatting ${this.luksDevice} to ext2`)
        let formatting = await exec(`sudo mkfs.ext2 ${this.luksDevice}`, this.echo)
        if (formatting.code !== 0) {
            Utils.pressKeyToExit(`Error: ${formatting.code} ${formatting.data}`)
        }
        // this.luksClose()
    }


    /**
     *
     */
    async luksOpen() {
        if (!fs.existsSync(this.luksDevice)) {
            // Utils.warning(`LUKS open volume: ${this.luksName}`)
            await exec(`cryptsetup luksOpen --type luks2 ${this.luksFile} ${this.luksName}`, Utils.setEcho(true))
        } else {
            Utils.warning(`LUKS volume: ${this.luksName} already open`)
        }

        if (!fs.existsSync(this.luksMountpoint)) {
            await exec(`mkdir -p ${this.luksMountpoint}`, this.echo)
        }

        if (!Utils.isMountpoint(this.luksMountpoint)) {
            Utils.warning(`mount volume: ${this.luksDevice} on ${this.luksMountpoint}`)
            await exec(`mount ${this.luksDevice} ${this.luksMountpoint}`, this.echo)
        } else {
            Utils.warning(`mount volume: ${this.luksDevice} already mounted on ${this.luksMountpoint}`)
        }
    }


    /**
    *
    */
    async luksClose() {
        if (Utils.isMountpoint(this.luksMountpoint)) {
            await exec(`umount ${this.luksMountpoint}`, this.echo)
        }

        if (fs.existsSync(this.luksDevice)) {
            Utils.warning(`LUKS close volume: ${this.luksName}`)
            await exec(`cryptsetup luksClose ${this.luksName}`, this.echo)
        }
    }

}
