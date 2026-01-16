/**
 * src/krill/classes/krill-enums.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

/**
 * 
 */
export enum InstallationMode {
    EraseDisk = "Erase disk",
    Luks = "Erase disk/Encrypted",
    Replace = "Replace partition",
}

/**
 * 
 */
export enum SwapChoice {
    File = "file",
    None = "none",
    Small = "small",
    Suspend = "suspend",
}

export enum Bios {
    EFI = "efi",
    Legacy = "legacy"
}

export enum FsType {
    btrfs = "btrfs",
    ext2 = "ext2",
    ext3 = "ext3",
    ext4 = "ext4",
    ntfs = "ntfs",
    xfs = "xfs",
    zfs = "zfs",
}