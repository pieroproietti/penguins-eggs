/**
 * ./src/krill/prepare.d/partitions.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import React from 'react'
import {confirm} from './confirm.js'

import Partitions from '../../components/partitions.js'
import { IPartitions } from '../../interfaces/i_krill.js'
import { SwapChoice, InstallationMode } from '../krill_enums.js'
import Prepare from '../prepare.js'
import selectFileSystemType from '../../lib/select_filesystem_type.js'
import selectInstallationDevice from '../../lib/select_installation_device.js'
import selectReplacedPartition from '../../lib/select_replaced_partition.js'
import selectUserSwapChoice from '../../lib/select_user_swap_choice.js'

import shx from 'shelljs'

import selectInstallationMode from '../../lib/select_installation_mode.js'


/**
 * PARTITIONS
 */
export async function partitions(this: Prepare, installationDevice = "", crypted = false, pve = false, btrfs = false): Promise<IPartitions> {

    // Calamares won't use any devices with iso9660 filesystem on it.
    const drives = shx.exec('lsblk |grep disk|cut -f 1 "-d "', { silent: true }).stdout.trim().split('\n')
    let driveList: string[] = []
    drives.forEach((element: string) => {
        if (!element.includes('zram')) {
            driveList.push('/dev/' + element)
        }
    })
    installationDevice = driveList[0] // Solo per selezionare il default

    let replacedPartition = this.krillConfig.replacedPartition

    let installationMode = this.krillConfig.installationMode

    let knownInstallationModes = Object.values(InstallationMode) as Array<string>
    let knownSwapChoices = Object.values(SwapChoice) as Array<string>


    if (!knownInstallationModes.includes(installationMode)) {
        installationMode = InstallationMode.EraseDisk
    }

    if (crypted) {
        installationMode = InstallationMode.Luks
    }

    let filesystemType = 'ext4'

    let userSwapChoice = {} as SwapChoice
    if (knownSwapChoices.includes(this.krillConfig.userSwapChoice))
        userSwapChoice = this.krillConfig.userSwapChoice
    else {
        userSwapChoice = SwapChoice.Small
    }

    let partitionsElem: JSX.Element
    while (true) {
        partitionsElem = <Partitions installationDevice={installationDevice} installationMode={installationMode} filesystemType={filesystemType} userSwapChoice={userSwapChoice} replacedPartition={replacedPartition} />
        if (await confirm(partitionsElem, "Confirm Partitions datas?")) {
            break
        } else {
            installationDevice = driveList[0] // Solo per selezionare il default
            installationMode = InstallationMode.EraseDisk
            if (crypted) {
                installationMode = InstallationMode.Luks
            }

            installationDevice = await selectInstallationDevice()
            installationMode = await selectInstallationMode()

            if (installationMode === InstallationMode.Replace) {
                replacedPartition = await selectReplacedPartition()
                filesystemType = await selectFileSystemType()
                userSwapChoice = SwapChoice.File

            } else if (installationMode === InstallationMode.EraseDisk) {
                replacedPartition = ""
                filesystemType = await selectFileSystemType()
                userSwapChoice = await selectUserSwapChoice(userSwapChoice)

            } else if (installationMode === InstallationMode.Luks) {
                replacedPartition = ""
                userSwapChoice = SwapChoice.File
            }
        }
    }

    return {
        installationDevice: installationDevice,
        installationMode: installationMode,
        filesystemType: filesystemType,
        userSwapChoice: userSwapChoice,
        replacedPartition: replacedPartition
    }
}

