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

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Ritorna true se c'è bisogno del mount --bind
 *
 * Ci sono tre tipologie:
 *
 * - normal solo la creazione della directory, nessun mount
 * - merged creazione della directory e mount ro
 * - mergedAndOverlay creazione directory, overlay e mount rw
 * - copied: creazione directory e copia
 */
export function merged(this: Ovary, dir: string): boolean {
    if (this.verbose) {
        console.log('Ovary: merged')
    }

    let merged = true

    if (dir === 'home') {
        merged = this.clone
    } else {
        const noMergeDirs = [
            'boot', // will be copied now
            'cdrom',
            'etc', // copied
            'dev',
            'media',
            'mnt',
            'proc',
            'run',
            'swapfile',
            'sys',
            'tmp'
        ]

        // deepin
        noMergeDirs.push('data', 'recovery')

        for (const noMergeDir of noMergeDirs) {
            if (dir === noMergeDir) {
                merged = false
            }
        }
    }

    return merged
}

/**
 * Restituisce true per le direcory da montare con overlay
 *
 * Ci sono tre tipologie:
 *
 * - normal solo la creazione della directory, nessun mount
 * - merged creazione della directory e mount ro
 * - mergedAndOverlay creazione directory, overlay e mount rw
 *
 * @param dir
 */
export function mergedAndOverlay(this: Ovary, dir: string): boolean {
    if (this.verbose) {
        console.log('Ovary: mergedAndOverlay')
    }

    /**
     * Debian: usrmerged
     * bin -> usr/bin
     * lib -> usr/lib
     * lib64 -> usr/lib64
     * sbin -> usr/sbin
     * 
     * 'bin' rimossa da overlay
     */

    // aggiunto bin per autologin su Alpine
    // const mountDirs = ['etc', 'usr', 'var']
    const mountDirs = ['usr', 'var']
    let mountDir = ''
    let overlay = false
    for (mountDir of mountDirs) {
        if (mountDir === dir) {
            overlay = true
        }
    }

    return overlay
}
