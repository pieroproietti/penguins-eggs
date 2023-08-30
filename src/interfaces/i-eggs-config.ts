export interface IEggsConfig {
  version: string
  snapshot_dir: string
  snapshot_basename: string
  snapshot_prefix: string
  snapshot_excludes: string
  mountpoint_dir: string // new
  user_opt: string
  user_opt_passwd: string
  root_passwd: string
  theme: string
  force_installer: boolean
  make_efi: boolean
  make_md5sum: boolean
  make_isohybrid: boolean
  compression: string
  ssh_pass: boolean
  timezone: string
  locales_default: string
  locales: string[]
  pmount_fixed: boolean
  machine_id: string
  vmlinuz: string
  initrd_img: string
}
