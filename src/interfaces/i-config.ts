export interface IConfig {
    version: string
    snapshot_dir: string
    snapshot_basename: string
    snapshot_prefix: string
    snapshot_excludes: string
    opt_user: string
    opt_user_passwd: string
    root_passwd: string
    theme: string
    make_efi: boolean
    make_md5sum: boolean
    make_isohybrid: boolean
    compression: string
    ssh_pass: boolean
    timezone: string
    locales: string []
    locales_default: string
    pmount_fixed: boolean
    netconfig_opt: string
    ifnames_opt: string
  }
