# Shared Tool Lists

Package definitions used by adapters to install recovery tools across all
supported distro families.

## Format

7-column, pipe-separated:

```
logical-name | arch-pkg | debian-pkg | fedora-pkg | suse-pkg | alpine-pkg | gentoo-pkg
```

- Lines starting with `#` are comments
- Use `--` for packages unavailable on a given distro
- Multiple packages in one cell are space-separated

## Files

- `core-tools.list` -- Minimal tools present in every recovery image
- `disk-tools.list` -- Disk management, partitioning, and filesystem tools
- `network-tools.list` -- Network diagnostics and connectivity
- `firmware.list` -- CPU microcode and firmware packages
- `rescue-tools.list` -- Data recovery and rescue-specific tools
- `gui-tools.list` -- GUI/desktop tools for graphical rescue environments
- `bootloaders.list` -- Bootloader packages (u-boot, refind, coreboot-utils, kexec-tools)
- `secureboot-tpm.list` -- Secure Boot and TPM2 tools
