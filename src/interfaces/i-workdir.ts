/**
 * ./src/interfaces/i-workdir.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export interface IWorkDir {
  lowerdir: string // default: ${bin}.lowerdir
  merged: string // default: ${bin}.merged
  bin: string // default: /home/eggs/mnt/bin/
  upperdir: string // default: ${bin}.upperdir
  workdir: string // default: ${bin}.workdir
}
