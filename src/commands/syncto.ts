/**
 * penguins-eggs
 * command: syncto.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// https://gist.github.com/ansemjo/6f1cf9d9b8f7ce8f70813f52c63b74a6

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
    exclusion: Flags.boolean({ char: 'e', description: 'use: exclude.list.d/clone.list' }),
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

  luksMountpoint = `/tmp/mnt/${this.luksName}`

  privateSquashfs = `private.squashfs`

  excludeFile = '/etc/penguins-eggs.d/exclude.list.d/clone.list'

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
    let exclude_nest = ''
    if (fs.existsSync(this.settings.work_dir.workdir)) {
      exclude_nest = `-e ${this.settings.config.snapshot_dir}`
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
                              ${exclude_nest} \
                              ${exclude_file} \
                              -keep-as-directory \ 
                              -noappend`

    mkPrivateSquashfs=mkPrivateSquashfs.replace(/\s\s+/g, ` `)
    await exec(mkPrivateSquashfs, Utils.setEcho(true))

    await exec(`rm -rf /tmp/tmpfs`, this.echo)

    await exec(`cp ${this.luksMountpoint}/${this.privateSquashfs} /tmp`, this.echo)

    //==========================================================================
    // Shrink LUKS volume
    //==========================================================================
    Utils.warning(`Calculate used up space of squashfs`)

    // Get squashfs size
    let cmd = `unsquashfs -s ${this.luksMountpoint}/${this.privateSquashfs} | grep "Filesystem size"| sed -e 's/.*size //' -e 's/ .*//'`
    let sizeString = (await exec(cmd, { echo: false, capture: true })).data
    let squashfsSize = parseInt(sizeString)
    Utils.warning(`Squashfs size: ${squashfsSize} bytes`)

    // Get squashfs block size
    cmd=`unsquashfs -s ${this.luksMountpoint}/${this.privateSquashfs} | grep "Block size"| sed -e 's/.*size //' -e 's/ .*//'`
    // let blockSizeString = (await exec(cmd, { echo: false, capture: true })).data
    //const squashfsBlockSize = parseInt(blockSizeString)
    const squashfsBlockSize=4096
    Utils.warning(`Squashfs block size: ${squashfsBlockSize} bytes`)

    // get number of blocks and pad squashfs
    let squashfsBlocks = squashfsSize / squashfsBlockSize
    if (squashfsBlocks % 1 != 0) { 
      squashfsBlocks = Math.ceil(squashfsBlocks)
      squashfsSize = squashfsBlocks * squashfsBlockSize
    }
    Utils.warning(`Padded squashfs on device, size ${squashfsSize} bytes, bloks: ${squashfsBlocks} of ${squashfsBlockSize} bytes `)

    // Shrink LUKS volume
    let luksBlockSize = 512
    let luksBlocks = squashfsSize / luksBlockSize
    if (luksBlocks % 1 != 0) { 
      luksBlocks = Math.ceil(luksBlocks)
    }

    Utils.warning(`Shrinking luks-volume to ${luksBlocks} blocks of ${luksBlockSize} bytes`)
    await exec(`cryptsetup resize ${this.luksName} -b ${luksBlocks}`, Utils.setEcho(false))

    // Get final size and shrink luks-volume
    let luksOffset = +(await exec(`cryptsetup status ${this.luksDevice} | grep offset | sed -e 's/ sectors$//' -e 's/.* //'`, { echo: false, capture: true })).data
    Utils.warning(`LUKS offset: ${luksOffset}`)
    let finalSize = squashfsSize + (luksOffset * luksBlockSize)
    Utils.warning(`Final size is ${finalSize} bytes, equal to ${bytesToGB(finalSize)}`)

    // Unmount luks-volume
    await exec(`umount ${this.luksMountpoint}`, Utils.setEcho(true))

    // close luks-volume
    await exec(`cryptsetup close ${this.luksName}`, Utils.setEcho(true))

    /**
     * Shrink file
     * https://gist.github.com/ansemjo/6f1cf9d9b8f7ce8f70813f52c63b74a6
     */
     await exec(`truncate -s ${finalSize} ${this.luksFile}`, Utils.setEcho(true))
    Utils.warning(`${this.luksFile} final size is ${bytesToGB(finalSize)}`)
  }
}

/**
 * Convert bytes to gigabytes
 */
function bytesToGB(bytes: number): string {
  const gigabytes = bytes / 1073741824;
  return gigabytes.toFixed(2) + ' GB';
}