/**
 * ./src/interfaces/i-partitions.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export type IPartitions = {
  alwaysShowPartitionLabels: boolean

  defaultFileSystemType: string
  drawNestedPartitions: boolean
  efiSystemPartition: string
  initialPartitioningChoice: string
  initialSwapChoice: string
  userSwapChoices: string[]
}
