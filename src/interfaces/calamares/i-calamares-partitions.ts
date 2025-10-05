/**
 * ./src/interfaces/i-calamares-partition.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface ICalamaresPartitions {
  efiSystemPartition?: string;
  efiSystemPartitionSize?: string;
  efiSystemPartitionName?: string;
  efi?: {
    recommendedSize?: string;
    minimumSize?: string;
    label?: string;
    mountPoint?: string;
  };
  lvm?: {
    enable?: boolean;
  };
  userSwapChoices: ("none" | "reuse" | "small" | "suspend" | "file")[];
  armInstall?: boolean;
  allowZfsEncryption?: boolean;
  drawNestedPartitions?: boolean;
  alwaysShowPartitionLabels?: boolean;
  defaultFileSystemType?: string;
  availableFileSystemTypes?: string[];
  mountpointFilesystemRestrictions?: unknown[];
  luksGeneration?: "luks1" | "luks2";
  enableLuksAutomatedPartitioning?: boolean;
  preCheckEncryption?: boolean;
  essentialMounts?: string[];
  allowManualPartitioning?: boolean;
  showNotEncryptedBootMessage?: boolean;
  partitionLayout?: unknown[];
  initialPartitioningChoice?: "none" | "erase" | "replace" | "alongside" | "manual";
  initialSwapChoice?: "none" | "small" | "suspend" | "reuse" | "file";
  requiredStorage?: number;
}
