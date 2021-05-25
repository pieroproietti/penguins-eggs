export type IPartitions = {
    efiSystemPartition: string,
    
    userSwapChoices: string[],
    drawNestedPartitions: boolean,
    alwaysShowPartitionLabels: boolean,
    initialPartitioningChoice: string,
    initialSwapChoice: string,
    defaultFileSystemType: string
}
