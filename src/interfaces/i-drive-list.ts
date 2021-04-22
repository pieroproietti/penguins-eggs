/**
 * Al momento NON viene usata!
 */

interface IMountPoint {
   path: string
}

export interface IDriveList {
   enumerator: string
   busType: string
   busVersion: string
   device: string
   devicePath: string
   raw: string
   description: string
   error: boolean
   size: number
   blockSize: number
   logicalBlockSize: number
   mountpoints: IMountPoint[]
   isReadOnly: boolean
   isSystem: boolean
   isVirtual: boolean
   isRemovable: boolean
   isCard: boolean
   isSCSI: boolean
   isUSB: boolean
   isUAS: boolean
}
