/**
 * ./src/interfaces/i-calamares-partition.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface ICalamaresPartition {
  efiSystemPartition: string; 
  efiSystemPartitionSize?: string; // 300M
  userSwapChoices: string[];
  swapPartitionName?: string;
  drawNestedPartitions: boolean;
  alwaysShowPartitionLabels: boolean;
  initialPartitioningChoice: string;
  initialSwapChoice: string;
  defaultFileSystemType: string;
  availableFileSystemTypes: string[];
  requiredStorage: number;
  ensureSuspendToDisk?: boolean;
  neverCreateSwap?: boolean;
  defaultPartitionTableType?: string;
  requiredPartitionTableType?: string | string[];
  enableLuksAutomatedPartitioning?: boolean;
  partitionLayout?: PartitionLayout[];
}

export interface PartitionLayout {
  name: string;
  type?: string;
  uuid?: string;
  attributes?: string;
  filesystem?: string;
  mountPoint?: string;
  size: string;
  minSize?: string;
  maxSize?: string;
  features?: { [key: string]: boolean | number | string };
}
