/**
 * ./src/const/c-krill.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { ILvmOptions } from '../interfaces/i-krill.js'

export class LvmOptionProxmox implements ILvmOptions {
    vgName: string = "pve"
    lvRootName: string = "root"
    lvRootFSType: string = ""
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

export class LvmOptionCustom implements ILvmOptions {
    vgName: string = ""
    lvRootName: string = ""
    lvRootFSType: string = ""
    lvRootSize: string = ""
    lvDataName: string = ""
    lvDataFSType: string = ""
    lvDataMountPoint: string = ""
}