/**
 * src/krill/classes/krill-enums.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

/**
 * 
 */
export enum InstallationMode {
    Standard = "Erase disk",
    Luks = "Erase disk/Encrypted",
    Replace = "Replace partition",
}

/**
 * 
 */
export enum SwapChoice {
    None = "none",
    Small = "small",
    Suspend = "suspend",
    File = "file",
}
