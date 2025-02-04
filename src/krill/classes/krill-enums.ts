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
* 4. LUKS+LVM2
 */

export enum InstallationMode {
    Standard = "standard",
    LVM2 = "lvm2",
    Luks = "luks", 
    LuksPlusLvm = "Luks+Lvm2",
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
