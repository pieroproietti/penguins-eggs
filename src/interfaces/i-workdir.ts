export interface IWorkDir {
  ovarium: string // default: /home/eggs/mnt/ovarium/
  lowerdir: string // default: ${ovarium}.lowerdir
  upperdir: string // default: ${ovarium}.upperdir
  workdir: string // default: ${ovarium}.workdir
  merged: string // default: ${ovarium}.merged
}
