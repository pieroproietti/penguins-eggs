/**
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../../classes/krill-sequence'
import { IWelcome, ILocation, IKeyboard, IPartitions, IUsers } from '../../interfaces/i-krill'
import { exec } from '../../lib/utils'
import Utils from './../../classes/utils'
import Install from '../../components/install'
import shx from 'shelljs'
import React from 'react';
import { render, RenderOptions } from 'ink'

/**
 * 
 * @param this 
 */
export default async function bootloaderConfig(this: Sequence): Promise<void> {
    if (this.distro.familyId === 'debian') {
        if (this.distro.distroLike === 'ubuntu') {
            this.bootloaderConfig_Ubuntu()
        } else {
            this.bootloaderConfig_Debian()
        }
    } else if (this.distro.familyId === 'archlinux') {
        this.bootloaderConfig_Arch()
    }
}

/**
 * 
 */
async function bootloaderConfig_Debian(this: Sequence) {
    this.execCalamaresModule('bootloader-config')
}

/**
 * 
 */
async function bootloaderConfig_Arch(this: Sequence) {
    console.log('bootloader Arch to do!')
}


/**
 * 
 */
async function bootloaderConfig_Ubuntu(this: Sequence) {
    let cmd = ''
    try {
        cmd = `chroot ${this.installTarget} apt-get update -y ${this.toNull}`
        await exec(cmd, this.echo)
    } catch (error) {
        console.log(error)
        await Utils.pressKeyToExit(cmd, true)
    }

    try {
        cmd = `chroot ${this.installTarget} sleep 1 ${this.toNull}`
        await exec(cmd, this.echo)
    } catch (error) {
        console.log(error)
        await Utils.pressKeyToExit(cmd, true)
    }

    let aptInstallOptions = ' apt install -y --no-upgrade --allow-unauthenticated -o Acquire::gpgv::Options::=--ignore-time-conflict '
    if (this.efi) {
        try {
            cmd = `chroot ${this.installTarget} ${aptInstallOptions} grub-efi-${Utils.machineArch()} --allow-unauthenticated ${this.toNull}`
            await exec(cmd, this.echo)
        } catch (error) {
            console.log(error)
            await Utils.pressKeyToExit(cmd, true)
        }
    } else {
        try {
            cmd = `chroot ${this.installTarget} ${aptInstallOptions} grub-pc ${this.toNull}`
            await exec(cmd, this.echo)
        } catch (error) {
            console.log(error)
            await Utils.pressKeyToExit(cmd, true)
        }
    }

    try {
        cmd = `chroot ${this.installTarget} sleep 1 ${this.toNull}`
        await exec(cmd, this.echo)
    } catch (error) {
        console.log(error)
        await Utils.pressKeyToExit(cmd, true)
    }

    try {
        cmd = `chroot ${this.installTarget} grub-install ${this.partitions.installationDevice} ${this.toNull}`
        await exec(cmd, this.echo)
    } catch (error) {
        console.log(error)
        await Utils.pressKeyToExit(cmd, true)
    }

    try {
        cmd = `chroot ${this.installTarget} grub-mkconfig -o /boot/grub/grub.cfg ${this.toNull}`
        await exec(cmd, this.echo)
    } catch (error) {
        console.log(error)
        await Utils.pressKeyToExit(cmd, true)
    }

    try {
        cmd = `chroot ${this.installTarget} update-grub ${this.toNull}`
        await exec(cmd, this.echo)
    } catch (error) {
        console.log(error)
        await Utils.pressKeyToExit(cmd, true)
    }

    try {
        cmd = `chroot ${this.installTarget} sleep 1 ${this.toNull}`
        await exec(cmd, this.echo)
    } catch (error) {
        console.log(error)
        await Utils.pressKeyToExit(cmd, true)
    }
}

/**
 * 
 */
async function execCalamaresModule(, this: Sequence, name: string) {
    const moduleName = this.installer.multiarchModules + name + '/module.desc'
    if (fs.existsSync(moduleName)) {
        const calamaresModule = yaml.load(fs.readFileSync(moduleName, 'utf8')) as ICalamaresModule
        let command = calamaresModule.command
        if (command !== '' || command !== undefined) {
            command += this.toNull
            await exec(command, this.echo)
        }
    }
}