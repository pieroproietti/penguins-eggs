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
    lvDataFSType: string = ""
    lvDataMountPoint: string = "/var/lib/vz"
}

export class LvmOptionUbuntu implements ILvmOptions {
    vgName: string = "ubuntu-vg"
    lvRootName: string = "ubuntu-vg--ubuntu-lv"
    lvRootFSType: string = ""
    lvRootSize: string = "100%"
    lvDataName: string = ""
    lvDataFSType: string = ""
    lvDataMountPoint: string = ""
}

export class LvmOptionGeneric implements ILvmOptions {
    vgName: string = "vg1"
    lvRootName: string = "root"
    lvRootFSType: string = ""
    lvRootSize: string = "100%"
    lvDataName: string = ""
    lvDataFSType: string = ""
    lvDataMountPoint: string = ""
}