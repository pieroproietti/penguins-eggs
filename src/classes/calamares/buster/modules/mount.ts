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
    text += `    - device: proc\n`              //     - device: proc
    text += `      fs: proc\n`                  //       fs: proc
    text += `      mountPoint: /proc\n`         //       mountPoint: /proc

    text += `    - device: sys\n`               //  - device: sys
    text += `      fs: sysfs\n`                 //    fs: sysfs
    text += `      mountPoint: /sys\n`          //    mountPoint: /sys

    text += `    - device: /dev\n`              //  - device: /dev
    text += `      mountPoint: /dev\n`          //    mountPoint: /dev
    text += `      options: bind\n`             //    options: bind

    text += `    - device: /dev/pts\n`          //  - device: /dev
    text += `      fs: devpts\n`                //    fs: devpts
    text += `      mountPoint: /dev/pts\n`      //    mountPoint: /dev/pts
    // mount -t devpts devpts /dev/pts

    text += `    - device: tmpfs\n`             //  - device: tmpfs
    text += `      fs: tmpfs\n`                 //    fs: tmpfs
    text += `      mountPoint: /run\n`          //    mountPoint: /run

    text += `    - device: /run/udev\n`         //  - device: /run/udev
    text += `      mountPoint: /run/udev\n`     //    mountPoint: /run/udev
    text += `      options: bind\n`             //    options: bind

    text += '\n'
text += `extraMountsEfi:\n`                     //  extraMountsEfi:
    text += `    - device: efivarfs\n`          //      - device: efivarfs
    text += `      fs: efivarfs\n`              //        fs: efivarfs
    text += `      mountPoint: /sys/firmware/efi/efivars\n` // mountPoint: /sys/firmware/efi/efivars
    
    return text
}
