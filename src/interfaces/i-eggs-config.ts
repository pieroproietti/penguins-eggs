/**
 * ./src/interfaces/i-eggs-config.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export interface IEggsConfig {
  compression: string
  force_installer: boolean
  initrd_img: string
  locales: string[]
  locales_default: string
  machine_id: string
  make_efi: boolean
  make_isohybrid: boolean
  make_md5sum: boolean
  pmount_fixed: boolean
  root_passwd: string
  snapshot_basename: string
  snapshot_dir: string // /home/eggs
  snapshot_excludes: string
  snapshot_mnt: string // /home/eggs/mnt
  snapshot_prefix: string
  ssh_pass: boolean
  theme: string
  timezone: string
  user_opt: string
  user_opt_passwd: string
  version: string
  vmlinuz: string
}
