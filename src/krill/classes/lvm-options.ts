import { ILvmOptions } from '../interfaces/i-krill.js'

export class LvmOptionProxmox implements ILvmOptions {
    vgName: string = "pve"
    lvRootFSType: string = "ext4"
    lvRootName: string = "root"
    lvRootSize: string = "20%"

    lvDataFSType: string = "ext4"
    lvDataMountPoint: string = "/var/lib/vz"
    lvDataName: string = "data"
}

export class LvmOptionUbuntu implements ILvmOptions {
    vgName: string = "ubuntu-vg"
    lvRootFSType: string = "ext4"
    lvRootName: string = "ubuntu-lv"
    lvRootSize: string = "100%"

    lvDataFSType: string = ""
    lvDataMountPoint: string = ""
    lvDataName: string = "none"
}

