/**
 * ./src/interfaces/i-calamares-partition.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// import { boolean } from "@oclif/core/lib/parser"

export interface ICalamaresPartition {
    alwaysShowPartitionLabels: boolean // true    
    availableFileSystemTypes: string [] //  ["ext4"]
    // swapPartitionName:      swap    
    // ensureSuspendToDisk:    true
    defaultFileSystemType: string //  "ext4"
    // neverCreateSwap:        false
    drawNestedPartitions: boolean // false
    efiSystemPartition: string //    "/boot/efi"
    // allowManualPartitioning:   true
    initialPartitioningChoice: string // none
    initialSwapChoice: string // none 
    // enableLuksAutomatedPartitioning:    true
    requiredStorage: 6
    // efiSystemPartitionSize:     300M
    userSwapChoices: string[]
}
