/**
 * ./src/krill/modules/unpackfs.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * * CLEANED: Just unpacks. SELinux is handled via autorelabel on first boot.
 */

import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../../classes/sequence.js'
import path from 'path'

/**
 * unpackfs
 * Scompatta il filesystem (senza tentare fix SELinux costosi qui)
 */
export default async function unpackfs(this: Sequence): Promise<void> {
  const squafsPath = path.join(this.distro.liveMediumPath, this.distro.squashfs)
  
  // -d: destination
  // -f: force (overwrite)
  const cmd = `unsquashfs -d ${this.installTarget} -f ${squafsPath} ${this.toNull}`
  
  // Usiamo echo false per evitare di intasare il log con migliaia di file
  const echoNo = Utils.setEcho(false)
  
  console.log('Unpacking filesystem (this may take a while)...')
  
  // Esecuzione
  await exec(cmd, echoNo)
  
  console.log('Filesystem unpacked successfully.')
}