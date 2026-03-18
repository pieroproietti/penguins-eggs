/**
 * ./src/krill/sequence.d/spacemit.d/index.ts
 * Punto di accesso per le variazioni SpacemiT X1
 */

import partition from './partition.js'
import bootloader from './bootloader.js'
import fstab from '../fstab.js'
import mkfs from './mkfs.js'

export const Spacemit = {
    partition,
    bootloader,
    fstab,
    mkfs
}
