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
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript'

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
        await this.luksCreate()
      } else {
        Utils.useRoot(this.id)
      }
    }


    /**
     *
     */
    async luksCreate() {
      Utils.warning(`Erasing previous LUKS Volume on ${this.luksFile}`)
      let clean=`rm -rf /tmp/${this.luksName}`
      await exec(clean)

      let maxSize="10G"
      Utils.warning(`Creating LUKS Volume on ${this.luksFile}, size ${maxSize}`)
      await exec(`truncate -s ${maxSize} ${this.luksFile}`)

      Utils.warning(`Set up encryption`)
      await exec(`cryptsetup luksFormat ${this.luksFile}`)
      
      Utils.warning(`Open LUKS volume`)
      await exec(`cryptsetup luksOpen ${this.luksFile} ${this.luksName}`)

      let destHome="/home"
      let destEtc = "/etc"

      Utils.warning(`Create a dummy filesystem`)
      let dummy_fs="/tmp/dummy_fs"
      await exec(`mkdir -p ${dummy_fs}${destEtc}`)
      await exec(`cp /etc/group /etc/passwd /etc/shadow ${dummy_fs}${destEtc}`)
      //await exec(`mkdir -p ${dummy_fs}${destHome}`)
      //await exec(`touch ${dummy_fs}${destHome}.keepIt`)
      await exec(`mksquashfs ${dummy_fs} /dev/mapper/${this.luksName} -progress -noappend`)     
      await exec(`rm -rf ${dummy_fs}`)

      Utils.warning(`Appending /home`)
      let srcHome="/home/"
      await exec(`mksquashfs ${srcHome} /dev/mapper/${this.luksName} -keep-as-directory -progress -e /home/eggs -ef /etc/penguins-eggs.d/exclude.list.d/exclude.list.cryptedclone`)

      Utils.warning(`Calculate used up space of squashfs`)
      let cmd=`unsquashfs -s /dev/mapper/${this.luksName} | grep "Filesystem size"| sed -e 's/.*size //' -e 's/ .*//'`
      let sizeString = (await exec(cmd, { echo: false, capture: true })).data
      let size=parseInt(sizeString)
      Utils.warning(`Squashfs size: ${size} bytes`)

      const blockSize=131072
      // get number of blocks and pad squashfs
      let blocks=size / blockSize
      if (blocks % 1 != 0) { // Se il numero di blocchi non è un numero intero
        blocks = Math.ceil(blocks); // Arrotonda all'intero successivo
        size = blocks * blockSize; // Calcola la nuova dimensione
      }
      Utils.warning(`Padded squashfs on device, size ${size} bytes, bloks: ${blocks} of ${blockSize} bytes `)

      // Shrink LUKS volume
      let luksBlockSize=512
      let luksBlocks=size / luksBlockSize
      Utils.warning(`Shrinking LUKS volume to ${luksBlocks} blocks of ${luksBlockSize} bytes`)
      await exec(`cryptsetup resize ${this.luksName} -b ${luksBlocks}`)

      // # Get final size and shrink image file
      let luksOffset=+(await exec(`cryptsetup status ${this.luksName} | grep offset | sed -e 's/ sectors$//' -e 's/.* //'`, {echo:false, capture:true})).data
      let finalSize=luksOffset * luksBlockSize + size
      await exec(`cryptsetup luksClose ${this.luksName}`)
      await exec(`truncate -s ${finalSize} ${this.luksFile}`)
      Utils.warning(`Final size is ${finalSize} bytes`)

      // Moving the file to the right place
      await exec(`mv ${this.luksFile} /run/live/medium/live/`)
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
