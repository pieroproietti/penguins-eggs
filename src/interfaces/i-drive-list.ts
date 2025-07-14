/**
 * ./src/interfaces/i-drive-list.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

interface IMountPoint {
  path: string
}

export interface IDriveList {
  blockSize: number
  busType: string
  busVersion: string
  description: string
  device: string
  devicePath: string
  enumerator: string
  error: boolean
  isCard: boolean
  isReadOnly: boolean
  isRemovable: boolean
  isSCSI: boolean
  isSystem: boolean
  isUAS: boolean
  isUSB: boolean
  isVirtual: boolean
  logicalBlockSize: number
  mountpoints: IMountPoint[]
  raw: string
  size: number
}
