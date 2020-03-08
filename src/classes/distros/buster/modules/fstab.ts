/**
 * 
 */
export function fstab(): string {
    let text = ``
    text += `---\n`
    text += `mountOptions:\n`
    text += `    default: defaults,noatime\n`
    text += `    btrfs: defaults,noatime,space_cache,autodefrag\n`
    text += `ssdExtraMountOptions:\n`
    text += `    ext4: discard\n`
    text += `    jfs: discard\n`
    text += `    xfs: discard\n`
    text += `    swap: discard\n`
    text += `    btrfs: discard,compress=lzo\n`
    text += `crypttabOptions: luks,keyscript=/bin/cat\n`
    return text
}