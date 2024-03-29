/**
 * penguins-eggs
 * command: syncto.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
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
    file: Flags.string({ char: 'f', description: 'file luks-volume encrypted' }),
    exclusion: Flags.boolean({ char: 'e', description: 'exclude files using exclude.list.cryptedclone template' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
  }

  static description = 'Save users and users\' data ENCRYPTED'
  static examples = [
    'sudo eggs syncto',
    'sudo eggs syncto --file /path/to/luks-volume',
    'sudo eggs syncto --exclusion'
  ]

  verbose = false

  echo = {}

  luksName = 'luks-volume'

  luksFile = `/tmp/${this.luksName}`

  luksDevice = `/dev/mapper/${this.luksName}`

  luksMountpoint = `/mnt/${this.luksName}`

  privateSquashfs = `private.squashfs`

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
    let clean = `rm -rf ${this.luksFile}`
    await exec(clean)

    let maxSize = "10G"
    Utils.warning(`Creating LUKS Volume on ${this.luksFile}, size ${maxSize}`)
    await exec(`truncate -s ${maxSize} ${this.luksFile}`)

    Utils.warning(`Creating LUKS Volume on ${this.luksFile}`)
    await exec(`cryptsetup luksFormat ${this.luksFile}`, Utils.setEcho(true))

    //==========================================================================
    // Open created LUKS volume
    //==========================================================================
    Utils.titles(this.id + ' ' + this.argv + ' Open LUKS volume')

    // open LUKS volume
    await exec(`cryptsetup luksOpen ${this.luksFile} ${this.luksName}`, Utils.setEcho(true))
    await exec('udevadm settle', Utils.setEcho(true))

    // formatta ext4 il volume
    await exec(`mkfs.ext4 ${this.luksDevice}`, Utils.setEcho(true))

    // mount LUKS volume
    if (!fs.existsSync(this.luksMountpoint)) {
      await exec(`mkdir -p ${this.luksMountpoint}`, Utils.setEcho(true))
    }
    if (!Utils.isMountpoint(this.luksMountpoint)) {
      Utils.warning(`mounting volume: ${this.luksDevice} on ${this.luksMountpoint}`)
      await exec(`mount ${this.luksDevice} ${this.luksMountpoint}`, Utils.setEcho(true))
    } else {
      Utils.warning(`mount volume: ${this.luksDevice} already mounted on ${this.luksMountpoint}`)
    }

    
    //==========================================================================
    // Create squashfs
    //==========================================================================
    // Utils.titles(this.id + ' ' + this.argv + ' Create squashfs')
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
    let cmdSquashFsRoot =`mksquashfs ${dummy_root} ${this.luksMountpoint}/${this.privateSquashfs} ${c} ${e} -noappend`
    await exec(cmdSquashFsRoot, Utils.setEcho(true))

    let ef = ''  // exclude file
    if (this.excludeFiles) {
      ef = `-ef ${this.excludeFile}`
    }

    Utils.warning(`Appending /home to squashfs`)
    let cmdSquashFsHome =`mksquashfs /home ${this.luksMountpoint}/${this.privateSquashfs} ${c} ${e} ${ef} -keep-as-directory`
    await exec(cmdSquashFsHome, Utils.setEcho(true))

    //==========================================================================
    // Shrink LUKS volume
    //==========================================================================
    Utils.warning(`Calculate used up space of squashfs`)
    let cmd = `unsquashfs -s ${this.luksMountpoint}/${this.privateSquashfs} | grep "Filesystem size"| sed -e 's/.*size //' -e 's/ .*//'`
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
    Utils.warning(`Shrinking luks-volume to ${luksBlocks} blocks of ${luksBlockSize} bytes`)
    await exec(`cryptsetup resize ${this.luksName} -b ${luksBlocks}`, Utils.setEcho(false))

    // Get final size and shrink image file
    let luksOffset = +(await exec(`cryptsetup status ${this.luksName} | grep offset | sed -e 's/ sectors$//' -e 's/.* //'`, { echo: false, capture: true })).data
    let finalSize = luksOffset * luksBlockSize + size

    // Unmount LUKS volume
    await exec(`umount ${this.luksMountpoint}`, Utils.setEcho(true))

    // Close LUKS volume
    await exec(`cryptsetup luksClose ${this.luksName}`, Utils.setEcho(true))

    // Shrink image file
    //await exec(`truncate -s ${finalSize} ${this.luksFile}`, Utils.setEcho(true))
    //console.log(`truncate -s ${finalSize} ${this.luksFile}`)
    Utils.warning(`${this.luksFile} final size is ${finalSize} bytes`)
  }
}
