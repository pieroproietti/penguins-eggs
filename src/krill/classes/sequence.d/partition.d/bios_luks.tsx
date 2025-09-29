/**
 * ./src/krill/modules/partition.d/bios-luks.ts
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
export default async function biosLuks(this: Sequence, installDevice = "", p = ""): Promise<boolean> {
    await exec(`parted --script ${installDevice} mklabel msdos`, this.echo)
    await exec(`parted --script --align optimal ${installDevice} mkpart primary ext4         1MiB        512MiB`, this.echo) // sda1
    await exec(`parted --script --align optimal ${installDevice} mkpart primary ext4         512MiB       100%`, this.echo) // sda3
    await exec(`parted --script ${installDevice} set 1 boot on`, this.echo) // sda1
    await exec(`parted --script ${installDevice} set 1 esp on`, this.echo) // sda1

    // BOOT 512M
    this.devices.boot.name = `${installDevice}${p}1` // 'boot'
    this.devices.boot.fsType = 'ext4'
    this.devices.boot.mountPoint = '/boot'

    // disabilito spinner per introduzione passphrase
    let message = "Creating partitions"
    await redraw(<Install message={ message } percent = { 0} />)
    const passphrase = await getLuksPassphrase('evolution', 'evolution') // It's just a default
    await redraw(<Install message={ message } percent = { 0} spinner = { this.spinner } />)

    // Aggiungi parametri di sicurezza espliciti
    const cipher = "aes-xts-plain64"
    const keySize = "512"
    const hash = "sha512"

    // ROOT
    const cryptoRoot = await exec(`echo -n "${passphrase}" | cryptsetup --batch-mode --cipher ${cipher} --key-size ${keySize} --hash ${hash} --type luks2 --key-file=- -v luksFormat ${installDevice}${p}2`, this.echo)
    if (cryptoRoot.code !== 0) {
        Utils.warning(`Error: ${cryptoRoot.code} ${cryptoRoot.data}`)
        process.exit(1)
    }

    const cryptoRootOpen = await exec(`echo -n "${passphrase}" | cryptsetup --key-file=- --type luks2 luksOpen ${installDevice}${p}2 root_crypted`, this.echo)
    if (cryptoRootOpen.code !== 0) {
        Utils.warning(`Error: ${cryptoRootOpen.code} ${cryptoRootOpen.data}`)
        process.exit(1)
    }

    // this.devices.boot.name = DEFINED`
    this.devices.data.name = 'none'
    this.devices.efi.name = 'none'
    this.devices.root.name = `/dev/mapper/${this.luksRootName}`
    this.devices.root.cryptedFrom = `${installDevice}${p}2`
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
