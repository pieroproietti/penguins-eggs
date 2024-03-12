/**
 * penguins-eggs
 * command: syncto.ts
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
import {Command, Flags} from '@oclif/core'
import fs from 'fs'
import path from 'path'
import Utils from '../classes/utils'
import {exec} from '../lib/utils'

// backup
import {access} from 'fs/promises'
import {constants} from 'fs'
import Users from '../classes/users'
import {use} from 'chai'

/**
 *
 */
export default class Syncto extends Command {
    static flags = {
      delete: Flags.string({description: 'rsync --delete delete extraneous files from dest dirs'}),
      file: Flags.string({char: 'f', description: 'file LUKS volume encrypted'}),
      exclusion: Flags.boolean({char: 'e', description: 'exclude files using exclude.list.cryptedclone template' }),
      help: Flags.help({char: 'h'}),
      verbose: Flags.boolean({char: 'v', description: 'verbose'}),
    }

    static description = 'saves users and user data in a LUKS volume inside the iso'
    static examples = [
      'sudo eggs syncto',
      'sudo eggs syncto --file /path/to/fileLUKS',
      'sudo eggs syncto -e'
    ]

    verbose = false

    echo = {}

    luksName = 'luks-eggs-backup'

    luksFile = `/run/live/medium/live/${this.luksName}`

    luksDevice = `/dev/mapper/${this.luksName}`

    luksMountpoint = '/tmp/eggs-backup'

    exclude_file = '/etc/penguins-eggs.d/exclude.list.d/exclude.list.cryptedclone'

    /**
     *
     */
    async run(): Promise<void> {
      const {flags} = await this.parse(Syncto)

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

      let excludeFiles = false
      if (flags.exclusion) {
        excludeFiles = true
      }

      if (Utils.isRoot()) {
        /**
             * restore con file
             */
        if (fileVolume === '') {
          fileVolume = '/tmp/luks-eggs-data'
        }

        this.luksName = path.basename(fileVolume)
        this.luksFile = fileVolume
        this.luksDevice = `/dev/mapper/${this.luksName}`
        this.luksMountpoint = '/tmp/eggs-data'
        if (!fs.existsSync(fileVolume)) {
          await this.luksCreate()
        } else {
          Utils.warning(`LUKS volume: ${this.luksFile} exist, don't need create`)
        }

        if (fs.existsSync(fileVolume)) {
          await this.luksOpen()
          await this.backup(destDelete, excludeFiles)
          await this.luksClose()
        }
      } else {
        Utils.useRoot(this.id)
      }
    }

    /**
     *
     */
    async backup(destDelete = false, excludeFiles = false) {
      if (this.verbose) {
        Utils.warning('backup')
      }

      Utils.warning(`Saving users' data on ${this.luksFile}`)
      const usersArray = await this.usersFill()
      for (const element of usersArray) {
        if (element.saveIt && fs.existsSync(element.home)) {
          await exec(`mkdir -p ${this.luksMountpoint}/ROOT${element.home}`, this.echo)
          const source = element.home
          let dest = this.luksMountpoint + '/ROOT' + element.home
          dest = dest.slice(0, Math.max(0, dest.lastIndexOf('/')))

          let cmd = "rsync --archive"

          if (excludeFiles) {
            cmd += ` --exclude-from ${this.exclude_file}`
          }

          if (destDelete) {
            cmd += ` --delete`
          }

          cmd += ` ${source} ${dest}`

          await exec(cmd, this.echo)
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
      await access('/etc/passwd', constants.R_OK | constants.W_OK)
      const passwd = fs.readFileSync('/etc/passwd', 'utf-8').split('\n')
      for (const element of passwd) {
        const line = element.split(':')
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
      console.log('I will extimate volume size from your private data:')
      const users = await this.usersFill()
      for (const user of users) {
        if (user.login !== 'root' && user.saveIt) {
          let utype = 'user   '
          if (Number.parseInt(user.uid) < 1000) {
            utype = 'service'
          }

          console.log(`- ${utype}: ${user.login.padEnd(16)} \thome: ${user.home} \tsize: ${Utils.formatBytes(user.size)} \tBytes: ${user.size} `)
          totalSize += user.size
        }
      }

      console.log(`Total\t\t\t\t\t\t\tsize: ${Utils.formatBytes(totalSize)} \tBytes: ${totalSize}`)

      /**
         * after we get size, we can start building luks-volume
         */
      const binaryHeaderSize = 4_194_304
      const volumeSize = totalSize * 1.5 + binaryHeaderSize

      // Deciding blockSize and blocks
      const blockSize = 512
      let blocks = Math.ceil(volumeSize / blockSize)

      // We need a minimum size of 32 MB
      const minimunSize = 134_217_728 // 128 * 1024 *1024
      if (totalSize < minimunSize) {}

      if (blocks * blockSize < minimunSize) {
        blocks = Math.ceil(minimunSize / blockSize)
      }

      Utils.warning(`Creating an encrypted file ${this.luksFile} blocks=${blocks}, block size: ${blockSize}, size: ${Utils.formatBytes(blocks * blockSize)}`)
      await exec(`dd if=/dev/zero of=${this.luksFile} bs=${blockSize} count=${blocks}`, this.echo)

      // find first unused device
      const findFirstUnusedDevice = await exec('losetup -f', {echo: this.verbose, ignore: false, capture: true})
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
      const crytoSetup = await exec(`cryptsetup luksOpen --type luks2 ${this.luksFile} ${this.luksName}`, Utils.setEcho(true))
      if (crytoSetup.code !== 0) {
        Utils.pressKeyToExit(`Error: ${crytoSetup.code} ${crytoSetup.data}`)
      }

      Utils.warning(`Formatting ${this.luksDevice} to ext2`)
      const formatting = await exec(`sudo mkfs.ext2 ${this.luksDevice}`, this.echo)
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
