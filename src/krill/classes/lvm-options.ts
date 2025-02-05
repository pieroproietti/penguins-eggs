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
    lvRootName: string = "ubuntu-lv"
    lvRootFSType: string = "ext4"
    lvRootSize: string = "100%"
    lvDataName: string = "none"
    lvDataFSType: string = ""
    lvDataMountPoint: string = ""
}

