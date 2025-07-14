/**
 * ./src/krill/modules/partition.d/uefi-luks.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import { exec } from '../../../../lib/utils.js'
import Sequence from '../../sequence.js'
import Utils from '../../../../classes/utils.js'
import getLuksPassphrase from '../../../lib/get_luks_passphrase.js'

// React
import React from 'react';
import { render, RenderOptions, Box, Text } from 'ink'
import Install from '../../../components/install.js'

/**
 * 
 * @param this 
 * @param installDevice 
 * @param p 
 * @returns 
 */
export default async function uefiLuks(this: Sequence, installDevice = "", p = ""): Promise<boolean> {
    await exec(`parted --script ${installDevice} mklabel gpt`, this.echo)
    await exec(`parted --script ${installDevice} mkpart efi fat32               34s               256MiB`, this.echo) // sda1 EFI
    await exec(`parted --script ${installDevice} mkpart boot ext4             256MiB              768MiB`, this.echo) // sda2 boot
    await exec(`parted --script ${installDevice} mkpart root ext4 ${768}MiB                100%`, this.echo) // sda3 root
    await exec(`parted --script ${installDevice} set 1 boot on`, this.echo) // sda1
    await exec(`parted --script ${installDevice} set 1 esp on`, this.echo) // sda1


    // EFI 256M
    this.devices.efi.name = `${installDevice}${p}1` // 'efi'
    this.devices.efi.fsType = 'F 32 -I'
    this.devices.efi.mountPoint = '/boot/efi'

    // BOOT 512M
    this.devices.boot.name = `${installDevice}${p}2` // 'boot'
    this.devices.boot.fsType = 'ext4'
    this.devices.boot.mountPoint = '/boot'

    // disabilito spinner per introduzione passphrase
    let message = "Creating partitions"
    await redraw(<Install message={message} percent={0} />)
    const passphrase = await getLuksPassphrase('3volution', '3volution')
    await redraw(<Install message={message} percent={0} spinner={this.spinner} />)

    // Aggiungi parametri di sicurezza espliciti
    const cipher = "aes-xts-plain64"
    const keySize = "512"
    const hash = "sha512"

    // ROOT
    const cryptoRoot = await exec(`echo -n "${passphrase}" | cryptsetup --batch-mode --cipher ${cipher} --key-size ${keySize} --hash ${hash} --key-file=- -v luksFormat --type luks2 ${installDevice}${p}3`, this.echo)
    if (cryptoRoot.code !== 0) {
      Utils.warning(`Error: ${cryptoRoot.code} ${cryptoRoot.data}`)
      process.exit(1)
    }

    const cryptoRootOpen = await exec(`echo -n "${passphrase}" | cryptsetup --key-file=- luksOpen --type luks2 ${installDevice}${p}3 root_crypted`, this.echo)
    if (cryptoRootOpen.code !== 0) {
      Utils.warning(`Error: ${cryptoRootOpen.code} ${cryptoRootOpen.data}`)
      process.exit(1)
    }

    // this.devices.boot.name = DEFINED
    this.devices.data.name = 'none'
    // this.devices.efi.name = DEFINED
    this.devices.root.name = '/dev/mapper/root_crypted'
    this.devices.root.cryptedFrom = `${installDevice}${p}3`
    this.devices.root.fsType = 'ext4'
    this.devices.root.mountPoint = '/'
    this.devices.swap.name = 'none'
    return true
}

/**
 *
 * @param elem
 */
async function redraw(elem: JSX.Element) {
    let opt: RenderOptions = {}
    opt.patchConsole = false
    opt.debug = true
    console.clear()
    render(elem, opt)
}
