import { boolean } from "@oclif/core/lib/parser"

export interface ICalamaresPartition {
    efiSystemPartition: string //    "/boot/efi"
    // efiSystemPartitionSize:     300M
    userSwapChoices: string[]
    // swapPartitionName:      swap    
    // ensureSuspendToDisk:    true
    // neverCreateSwap:        false
    drawNestedPartitions: boolean // false
    alwaysShowPartitionLabels: boolean // true    
    // allowManualPartitioning:   true
    initialPartitioningChoice: string // none
    initialSwapChoice: string // none 
    defaultFileSystemType: string //  "ext4"
    availableFileSystemTypes: string [] //  ["ext4"]
    //enableLuksAutomatedPartitioning:    true
    requiredStorage: 6.0
}
