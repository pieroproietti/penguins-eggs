/**
 * ./src/interfaces/e-krill.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export enum SwapChoice {
    None = "none",
    Small = "small",
    Suspend = "suspend",
    File = "file"
}

export enum InstallationMode {
    Standard = "standard",
    FullEncrypted = "full-encrypted",
    LVM2 = "lvm2"
}