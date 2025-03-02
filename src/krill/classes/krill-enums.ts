/**
 * ./src/enum/e-krill.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * Ordine: La gerarchia è LUKS → LVM → Filesystem. 
 */

/**
* 1. Standard
* 2. LVM2
* 3. LUKS
 */

export enum InstallationMode {
    Standard = "Erase disk",
    Replace = "Replace partition",
    LVM2 = "lvm2",
    Luks = "Encrypted",
}

export enum LvmPartitionPreset {
    Custom = "custom",
    Proxmox = "proxmox",
    Ubuntu = "ubuntu",
}

export enum SwapChoice {
    None = "none",
    Small = "small",
    Suspend = "suspend",
    File = "file",
}
