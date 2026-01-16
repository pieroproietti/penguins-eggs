/**
 * ./src/classes/ovary.d/merge.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */


// packages
import path from 'node:path'

// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Ritorna true se c'è bisogno del mount --bind
 *
 * Ci sono quattro tipologie:
 *
 * - copied
 * - mergedAndOverlay
 * - merged
 * - just create
 */

export function copied(this: Ovary, dir: string): boolean {
    let copied = false

    const copiedDirs = [
        'boot',
        'etc'
    ]

    for (const copiedDir of copiedDirs) {
        if (dir === copiedDir) {
            copied = true
        }
    }

    return copied
}

/**
 * 
 */
export function mergedAndOverlay(this: Ovary, dir: string): boolean {
    // per Alpine ho agginto bin
    const moDirs = ['bin', 'usr', 'var']
    let mergedOverlay = false
    for (const moDir of moDirs) {
        if (moDir === dir) {
            mergedOverlay = true
        }
    }

    return mergedOverlay
}

/**
 * merged
 */
export function merged(this: Ovary, dir: string): boolean {
    let merged = true
    if (dir === 'home') {
        merged = this.clone || this.fullcrypt
    } else {
        const onlyFolders = [
            'cdrom',
            'dev',
            'media',
            'mnt',
            'proc',
            'run',
            'swapfile',
            'sys',
            'tmp'
        ]
        // deepiin
        onlyFolders.push('data', 'recovery')

        for (const onlyFolder of onlyFolders) {
            if (dir === onlyFolder) {
                merged = false
            }
        }
    }

    return merged
}
