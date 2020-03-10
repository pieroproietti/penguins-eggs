/**
 * 
 */
export function mount(): string {
    let text = ``
    text += `# Mount filesystems in the target (generally, before treating the\n`
    text += `# target as a usable chroot / "live" system). Filesystems are\n`
    text += `# automatically mounted from the partitioning module. Filesystems\n`
    text += `# listed here are **extra**. The filesystems listed in *extraMounts*\n`
    text += `# are mounted in all target systems. The filesystems listed in\n`
    text += `# *extraMountsEfi* are mounted in the target system **only** if\n`
    text += `# the host machine uses UEFI.\n`
    text += `---\n`
    text += `# Extra filesystems to mount. The key's value is a list of entries; each\n`
    text += `# entry has four keys:\n`
    text += `#   - device    The device node to mount\n`
    text += `#   - fs        The filesystem type to use\n`
    text += `#   - mountPoint Where to mount the filesystem\n`
    text += `#   - options (optional) Extra options to pass to mount(8)\n`
    text += `#\n`
    text += `extraMounts:\n`
    text += `    - device: proc\n`
    text += `      fs: proc\n`
    text += `      mountPoint: /proc\n`
    text += `    - device: sys\n`
    text += `      mountPoint: /sys\n`
    text += `    - device: /dev\n`
    text += `      mountPoint: /dev\n`
    text += `      options: bind\n`
    text += `    - device: tmpfs\n`
    text += `      fs: tmpfs\n`
    text += `      mountPoint: /run\n`
    text += `    - device: tmpfs\n`
    text += `      fs: tmpfs\n`
    text += `      mountPoint: /tmp\n`
    text += `    - device: /run/udev\n`
    text += `      mountPoint: /run/udev\n`
    text += `      options: bind\n`
    text += '\n'
    text += `extraMountsEfi:\n`
    text += `    - device: efivarfs\n`
    text += `      fs: efivarfs\n`
    text += `      mountPoint: /sys/firmware/efi/efivars\n`
    
    return text
}
