/**
 * ./src/enum/e-krill.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * Ordine: La gerarchia è LUKS → LVM → Filesystem. 
 */

/**
* 1. Standard (root + swap)
* 2. LVM2
* 3. LUKS (crittografia)
* 4. LUKS + LVM2 (crittografia e LVM)
 */

export enum InstallationMode {
    Standard = "standard",
    LVM2 = "lvm2",
    Luks = "luks", 
    // LUKSLVM2 = "lvm2",
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
