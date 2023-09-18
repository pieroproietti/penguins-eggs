/**
 * penguins-eggs
 * interface: i-partitions.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export type IPartitions = {
  efiSystemPartition: string

  userSwapChoices: string[]
  drawNestedPartitions: boolean
  alwaysShowPartitionLabels: boolean
  initialPartitioningChoice: string
  initialSwapChoice: string
  defaultFileSystemType: string
}
