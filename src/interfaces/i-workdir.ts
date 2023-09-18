/**
 * penguins-eggs
 * interface: i-workdir.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface IWorkDir {
  ovarium: string // default: /home/eggs/mnt/ovarium/
  lowerdir: string // default: ${ovarium}.lowerdir
  upperdir: string // default: ${ovarium}.upperdir
  workdir: string // default: ${ovarium}.workdir
  merged: string // default: ${ovarium}.merged
}
