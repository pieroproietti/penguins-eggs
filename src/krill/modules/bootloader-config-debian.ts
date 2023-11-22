/**
 * penguins-eggs
 * krill modules: bootloader-config.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'

export default async function bootloaderConfigDebian(this: Sequence) {
    this.execCalamaresModule('bootloader-config')
}