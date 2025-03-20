/**
 * ./src/classes/ovary.d/merge.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
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
 * Ci sono tre tipologie:
 *
 * - copied
 * - mergedAndOverlay
 * - merged
 * - just create
 */

export function copied(this: Ovary, dir: string): boolean {
    let copiedDirs = [
        'boot',
        'etc',
    ]
    let copied = false

    /**
     * On containers we copy all
     */
    if (Utils.isContainer()) {
        if (this.merged(dir)) {
            copied = true
        } else if (this.mergedAndOverlay(dir)) {
            copied = true
        }
    } else {
        for (const copiedDir of copiedDirs) {
            if (dir === copiedDir) {
                copied = true
            }
        }
    }
    return copied
}

/**
 * 
 */
export function mergedAndOverlay(this: Ovary, dir: string): boolean {
    const moDirs = ['usr', 'var']
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
        merged = this.clone
    } else {
        const justMks = [
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
        justMks.push('data', 'recovery')

        for (const justMk of justMks) {
            if (dir === justMk) {
                merged = false
            }
        }
    }

    return merged
}
