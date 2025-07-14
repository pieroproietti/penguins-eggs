/**
 * ./src/interfaces/i-workdir.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export interface IWorkDir {
  lowerdir: string // default: ${ovarium}.lowerdir
  merged: string // default: ${ovarium}.merged
  ovarium: string // default: /home/eggs/mnt/ovarium/
  upperdir: string // default: ${ovarium}.upperdir
  workdir: string // default: ${ovarium}.workdir
}
