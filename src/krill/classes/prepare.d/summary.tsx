/**
 * ./src/krill/prepare.d/keyboard.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import { render, RenderOptions } from 'ink'
import React from 'react';

import Summary from '../../components/summary.js'
import { IKeyboard , ILocation, IPartitions, IUsers} from '../../interfaces/i_krill.js'
import { InstallationMode } from '../krill_enums.js'
import Prepare from '../prepare.js'
import {confirm} from './confirm.js'

/**
 * SUMMARY
 */
export async function summary(this: Prepare, location: ILocation, keyboard: IKeyboard, partitions: IPartitions, users: IUsers) {
    let summaryElem: JSX.Element

    let message = `Double check: data on disk ${partitions.installationDevice} will be completely erased!`
    let erase = `On disk ${partitions.installationDevice} will be created a root partition formatted: ${partitions.filesystemType}`
    if (partitions.installationMode === InstallationMode.Replace) {
        message = `Double check: data on partition ${partitions.replacedPartition} will be completely erased!`
        erase = `Partition root on ${partitions.replacedPartition} will be formatted ${partitions.filesystemType}`
    } else if (partitions.installationMode === InstallationMode.Luks) {
        erase = `On disk ${partitions.installationDevice} will be created a LUKS encrypted volume`
    }

    if (this.unattended && this.nointeractive) {
        message = `Unattended installation will start in 5 seconds...\npress CTRL-C to abort!`
    }
    


    while (true) {

        summaryElem = <Summary erase={erase} filesystemType={partitions.filesystemType} hostname={users.hostname} installationDevice={partitions.installationDevice} keyboardLayout={keyboard.keyboardLayout} keyboardModel={keyboard.keyboardModel} language={location.language} message={message} password={users.password} region={location.region} rootPassword={users.rootPassword} username={users.username} zone={location.zone} />
        if (this.unattended && this.nointeractive) {
            redraw(summaryElem)
            await sleep(5000)
            break
        } else if (this.unattended && !this.nointeractive) {
            if (await confirm(summaryElem, "Read the Summary, confirm or abort")) {
                break
            } else {
                process.exit(0)
            }
        } else if (await confirm(summaryElem, "Confirm Summary datas?")) {
            break
        }
    }
}



/**
 * Occorre farglierlo rigenerare a forza
 * anche quando NON cambiano i dati
 * forceUpdate
 */
function redraw(elem: JSX.Element) {
    const opt: RenderOptions = {}
    opt.patchConsole = true
    opt.debug = false
    console.clear()
    render(elem, opt)
  }
  
/**
 *
 * @param ms
 * @returns
 */
function sleep(ms = 0) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  
  
