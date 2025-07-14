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
    None = "none",
    Small = "small",
    Suspend = "suspend",
    File = "file",
}

export enum Bios {
    Legacy = "legacy",
    EFI = "efi"
}

export enum FsType {
    ext2 = "ext2",
    ext3 = "ext3",
    ext4 = "ext4",
    btrfs = "btrfs",
    xfs = "xfs",
    zfs = "zfs",
    ntfs = "ntfs",
}