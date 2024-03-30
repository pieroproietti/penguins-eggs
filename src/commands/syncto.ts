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
import { escape } from 'querystring'

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

    let maxSize = "2G"
    Utils.warning(`Creating LUKS Volume on ${this.luksFile}, size ${maxSize}`)
    await exec(`truncate -s ${maxSize} ${this.luksFile}`)

    Utils.warning(`Creating LUKS Volume on ${this.luksFile}`)
    await exec(`cryptsetup luksFormat ${this.luksFile}`, Utils.setEcho(true))

    //==========================================================================
    // Open created LUKS volume
    //==========================================================================
    Utils.titles(this.id + ' ' + this.argv + ' Open LUKS volume')

    // open LUKS volume
    let code=(await exec(`cryptsetup luksOpen ${this.luksFile} ${this.luksName}`, Utils.setEcho(true))).code
    if (code != 0) {
      Utils.error(`cryptsetup luksOpen ${this.luksFile} ${this.luksName} failed`)
      process.exit(code)
    }
    await exec('udevadm settle', Utils.setEcho(true))

    // formatta ext4 il volume
    await exec(`mkfs.ext4 ${this.luksDevice}`, Utils.setEcho(true))

    // mount LUKS volume
    if (!fs.existsSync(this.luksMountpoint)) {
      await exec(`mkdir -p ${this.luksMountpoint}`, Utils.setEcho(true))
    }
    if (!Utils.isMountpoint(this.luksMountpoint)) {
      Utils.warning(`mounting volume: ${this.luksDevice} on ${this.luksMountpoint}`)
      let code = (await exec(`mount ${this.luksDevice} ${this.luksMountpoint}`, Utils.setEcho(true))).code
      if (code != 0) {
        Utils.error(`mount ${this.luksDevice} ${this.luksMountpoint} failed`)
        process.exit(code)
      }
    } else {
      Utils.warning(`mounting volume: ${this.luksDevice} already mounted on ${this.luksMountpoint}, cleaning`)
      await exec(`rm -f ${this.privateSquashfs}`, Utils.setEcho(true))
    }

    
    //==========================================================================
    // Create squashfs
    //==========================================================================
    Utils.warning(`Creating private.squashfs`)
    const compressors = new Compressors()
    await compressors.populate()

    // comp
    let comp = ''
    this.settings = new Settings()
    if (await this.settings.load()) {
      let compression = compressors.fast()
      if (this.settings.config.compression==`max`) {
        compression = compressors.max()
      } else if (this.settings.config.compression==`standard`) {
        compression = compressors.standard()
      }
      comp = `-comp ${compression}`
    }

    // exclude /home/eggs
    let exclude = ''
    if (fs.existsSync(this.settings.work_dir.workdir)) {
      exclude = `-e ${this.settings.config.snapshot_dir}`
    }

    // exclude file
    let exclude_file = ''
    if (this.excludeFiles) {
      exclude_file = `-ef ${this.excludeFile}`
    }

    // creato tmpfs per /etc/
    await exec(`mkdir -p /tmp/tmpfs/etc`, this.echo)
    await exec(`cp -a /etc/passwd /tmp/tmpfs/etc`, this.echo)
    await exec(`cp -a /etc/group /tmp/tmpfs/etc`, this.echo)
    await exec(`cp -a /etc/shadow /tmp/tmpfs/etc`, this.echo)
    await exec(`mkdir -p /tmp/tmpfs/etc/lightdm`, this.echo)                          // lightdm
    await exec(`cp -a /etc/lightdm/lightdm.conf /tmp/tmpfs/etc/lightdm/`, this.echo)  // lightdm  

    let mkPrivateSquashfs =`mksquashfs \
                                  /tmp/tmpfs/etc \
                                  /home \
                                  ${this.luksMountpoint}/${this.privateSquashfs} \
                                  ${comp} \
                                  ${exclude} \
                                  ${exclude_file} \
                                  -m \ 
                                  -keep-as-directory \ 
                                  -noappend`
                                  
    mkPrivateSquashfs=mkPrivateSquashfs.replace(/\s\s+/g, ` `)
    await exec(mkPrivateSquashfs, Utils.setEcho(true))

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
    // await exec(`truncate -s ${finalSize} ${this.luksFile}`, Utils.setEcho(true))
    Utils.warning(`${this.luksFile} final size is ${finalSize} bytes`)
  }
}
