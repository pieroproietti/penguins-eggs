import { ILvmOptions } from '../interfaces/i-krill.js'

export class LvmOptionProxmox implements ILvmOptions {
    vgName: string = "pve"
    lvRootName: string = "root"
    lvRootFSType: string = "ext4"
    lvRootSize: string = "20%"
    lvDataName: string = "data"
    lvDataFSType: string = "ext4"
    lvDataMountPoint: string = "/var/lib/vz"
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

