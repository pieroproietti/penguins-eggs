/**
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Install from '../../components/install'
import React from 'react';
import { render, RenderOptions } from 'ink'
import Sequence from '../krill-sequence'
import Utils from '../../classes/utils'
import { exec } from '../../lib/utils'
 
  /**
 * 
 * @param mountpoint 
 */
 export default async function umount(this: Sequence, mountPoint = '') {
    let message = 'umount: ' + mountPoint
    if (Utils.isMountpoint(mountPoint)) {
        try {
            await exec(`umount ${mountPoint} ${this.toNull}`, this.echo)
            await exec('sleep 1', this.echo)
        } catch (error) {
            message += + mountPoint + JSON.stringify(error)
            //redraw(<Install message={ message } percent = { 1} />)
            await Utils.pressKeyToExit(message)
        }
    }
}



