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
import path from 'path'
import fs from 'fs'
import { exec } from '../lib/utils'
import Compressors from '../classes/compressors'
import Settings from '../classes/settings'
import Utils from '../classes/utils'

/**
 *
 */
export default class Syncto extends Command {
  static flags = {
    file: Flags.string({ char: 'f', description: 'file LUKS encrypted' }),
    exclusion: Flags.boolean({ char: 'e', description: 'exclude files using exclude.list.cryptedclone template' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
  }

  static description = 'Save users and users\' data ENCRYPTED'
  static examples = [
    'sudo eggs syncto',
    'sudo eggs syncto --file /path/to/fileLUKS',
    'sudo eggs syncto --exclusion'
  ]

  verbose = false

  echo = {}

  luksName = 'luks-eggs-backup'

  luksFile = `/run/live/medium/live/${this.luksName}`

  luksDevice = `/dev/mapper/${this.luksName}`

  luksMountpoint = '/tmp/eggs-backup'

  excludeFile = '/etc/penguins-eggs.d/exclude.list.d/exclude.list.cryptedclone'

  excludeFiles = false

  settings = {} as Settings


  /**
   *
   */
  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Syncto)

    if (flags.verbose) {
      this.verbose = true
    }

    this.echo = Utils.setEcho(this.verbose)

    let fileLuks = ''
    if (flags.file) {
      fileLuks = flags.file
    }

    if (flags.exclusion) {
      this.excludeFiles = true
    }

    if (Utils.isRoot()) {
      if (fileLuks === '') {
        fileLuks = '/tmp/luks-eggs-data'
      }

      this.luksFile = fileLuks
      this.luksName = path.basename(this.luksFile)
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
    let clean = `rm -rf /tmp/${this.luksName}`
    await exec(clean)

    let maxSize = "10G"
    Utils.warning(`Creating LUKS Volume on ${this.luksFile}, size ${maxSize}`)
    await exec(`truncate -s ${maxSize} ${this.luksFile}`)

    Utils.warning(`Set up encryption`)
    await exec(`cryptsetup luksFormat ${this.luksFile}`)

    //==========================================================================
    // Open created LUKS volume
    //==========================================================================
    Utils.titles(this.id + ' ' + this.argv + ' Open LUKS volume')

    let res=await exec(`cryptsetup luksOpen ${this.luksFile} ${this.luksName}`)
    if (res.code==0) {
      console.log('device opened')
    } else if (res.code==1) {
      console.log('wrong parameters')
    } else if (res.code==2) {
      console.log('no permission (bad passphrase)')
    } else if (res.code==3) {
      console.log('out of memory')
    } else if (res.code==4) {
      console.log('wrong device specified')
    } else if (res.code==5) {
      console.log('device already exists or device is busy')
    }
    // wait until device is ready
    await exec('udevadm settle', Utils.setEcho(false))
    
    //==========================================================================
    // Create squashfs
    //==========================================================================
    Utils.titles(this.id + ' ' + this.argv + ' Create squashfs')
    const compressors = new Compressors()
    await compressors.populate()

    // E' orribile, confermo!
    this.settings = new Settings()
    let e = '' // exclude nest
    let c = '' // compression
    if (await this.settings.load()) {
      let compression = compressors.fast()
      if (this.settings.config.compression==`max`) {
        compression = compressors.max()
      } else if (this.settings.config.compression==`standard`) {
        compression = compressors.standard()
      }

      if (fs.existsSync(this.settings.work_dir.workdir)) {
        e = `-e ${this.settings.config.snapshot_dir}`
      }
      c = `-comp ${compression}`
    }

    // Create dummy_root
    let dummy_root = "/tmp/dummy_root"
    await exec(`mkdir -p ${dummy_root}/etc`)
    await exec(`cp /etc/group /etc/passwd /etc/shadow ${dummy_root}/etc`)

    Utils.warning(`Creating squashfs with /etc`)
    let cmdSquashFsRoot =`mksquashfs ${dummy_root} /dev/mapper/${this.luksName} ${c} ${e} -noappend`
    await exec(cmdSquashFsRoot, Utils.setEcho(true))

    let ef = ''  // exclude file
    if (this.excludeFiles) {
      ef = `-ef ${this.excludeFile}`
    }

    Utils.warning(`Appending /home to squashfs`)
    let cmdSquashFsHome =`mksquashfs /home /dev/mapper/${this.luksName} ${c} ${e} ${ef} -keep-as-directory`
    await exec(cmdSquashFsHome, Utils.setEcho(true))

    //==========================================================================
    // Shrink LUKS volume
    //==========================================================================
    Utils.warning(`Calculate used up space of squashfs`)
    let cmd = `unsquashfs -s /dev/mapper/${this.luksName} | grep "Filesystem size"| sed -e 's/.*size //' -e 's/ .*//'`
    let sizeString = (await exec(cmd, { echo: false, capture: true })).data
    let size = parseInt(sizeString)
    Utils.warning(`Squashfs size: ${size} bytes`)

    const blockSize = 131072
    // get number of blocks and pad squashfs
    let blocks = size / blockSize
    if (blocks % 1 != 0) { // Se il numero di blocchi non è un numero intero
      blocks = Math.ceil(blocks); // Arrotonda all'intero successivo
      size = blocks * blockSize; // Calcola la nuova dimensione
    }
    Utils.warning(`Padded squashfs on device, size ${size} bytes, bloks: ${blocks} of ${blockSize} bytes `)

    // Shrink LUKS volume
    let luksBlockSize = 512
    let luksBlocks = size / luksBlockSize
    Utils.warning(`Shrinking LUKS volume to ${luksBlocks} blocks of ${luksBlockSize} bytes`)
    await exec(`cryptsetup resize ${this.luksName} -b ${luksBlocks}`, Utils.setEcho(false))

    // # Get final size and shrink image file
    let luksOffset = +(await exec(`cryptsetup status ${this.luksName} | grep offset | sed -e 's/ sectors$//' -e 's/.* //'`, { echo: false, capture: true })).data
    let finalSize = luksOffset * luksBlockSize + size
    await exec(`cryptsetup luksClose ${this.luksName}`, Utils.setEcho(false))
    await exec(`truncate -s ${finalSize} ${this.luksFile}`, Utils.setEcho(false))
    Utils.warning(`Final size is ${finalSize} bytes`)
  }
}

