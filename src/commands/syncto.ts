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
      let maxSize="10G"
      Utils.warning(`Creating LUKS Volume on ${this.luksFile}, size ${maxSize}`)
      await exec(`truncate -s ${maxSize} ${this.luksFile}`)

      Utils.warning(`Set up encryption`)
      await exec(`cryptsetup luksFormat ${this.luksFile}`)
      
      Utils.warning(`Open LUKS volume`)
      await exec(`cryptsetup luksOpen ${this.luksFile} ${this.luksName}`)

      Utils.warning(`Creating squashfs containing /home`)
      await exec(`mksquashfs /home /dev/mapper/${this.luksName}" -progress -noappend`)
      await exec(`mksquashfs /etc/group /dev/mapper/${this.luksName}" -progress`)
      await exec(`mksquashfs /etc/passwd /dev/mapper/${this.luksName}" -progress`)
      await exec(`mksquashfs /etc/shadow /dev/mapper/${this.luksName}" -progress`)

      Utils.warning(`Calculate used up space of squashfs`)
      let size=+(await exec(`unsquashfs -s "/dev/mapper/${this.luksName}" | grep "Filesystem size" | sed -e 's/.*size //' -e 's/ .*//'`)).data
      console.log(`Squashfs size: ${size} bytes`)
      const blockSize=4096 
      let blocks= +size / blockSize
      if (blocks % blockSize !=0) {
        blocks +=1
        size= blocks * blockSize
      }
      console.log(`Padded squashfs size on device: ${size} bytes`)
      await exec(`truncate -s ${size} "/dev/mapper/${this.luksName}"`)      
      
      // Shrink LUKS volume
      let luksBlockSize=512
      let luksBlocks=size / luksBlockSize
      console.log(`Shrinking LUKS volume to ${blocks} blocks of ${luksBlockSize} bytes`)
      await exec(`cryptsetup resize ${this.luksName} -b ${luksBlocks}`)

      // Get final size and shrink image file
      let luksOffset=await exec(`cryptsetup status ${this.luksName} | grep offset | sed -e 's/ sectors$//' -e 's/.* //'`)
      let finalSize=luksOffset * luksBlockSize + size
      await exec(`cryptsetup luksClose ${this.luksName}`)
      await exec(`truncate -s ${finalSize} ${this.luksFile}`)
      console.log(`Final size is ${finalSize} bytes)

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
