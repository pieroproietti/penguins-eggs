/**
 * ./src/interfaces/i-calamares-partition.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface ICalamaresPartitions {
  allowManualPartitioning?: boolean;
  allowZfsEncryption?: boolean;
  alwaysShowPartitionLabels?: boolean;
  armInstall?: boolean;
  availableFileSystemTypes?: string[];
  defaultFileSystemType?: string;
  drawNestedPartitions?: boolean;
  efi?: {
    label?: string;
    minimumSize?: string;
    mountPoint?: string;
    recommendedSize?: string;
  };
  efiSystemPartition?: string;
  efiSystemPartitionName?: string;
  efiSystemPartitionSize?: string;
  enableLuksAutomatedPartitioning?: boolean;
  essentialMounts?: string[];
  initialPartitioningChoice?: "alongside" | "erase" | "manual" | "none" | "replace";
  initialSwapChoice?: "file" | "none" | "reuse" | "small" | "suspend";
  luksGeneration?: "luks1" | "luks2";
  lvm?: {
    enable?: boolean;
  };
  mountpointFilesystemRestrictions?: unknown[];
  partitionLayout?: unknown[];
  preCheckEncryption?: boolean;
  requiredStorage?: number;
  showNotEncryptedBootMessage?: boolean;
  userSwapChoices: ("file" | "none" | "reuse" | "small" | "suspend")[];
}
