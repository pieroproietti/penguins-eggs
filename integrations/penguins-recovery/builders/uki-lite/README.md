# uki-lite builder

Lightweight rescue UKI builder using [efi-mkuki](https://github.com/jirutka/efi-mkuki) or raw `objcopy`. No mkosi, systemd-ukify, or Go required.

## Dependencies

- `objcopy` and `objdump` (from binutils)
- An EFI stub (`systemd-boot` provides `linuxx64.efi.stub`)
- Optional: `efi-mkuki` for a cleaner build
- Optional: `sbctl` for Secure Boot signing

## Usage

```bash
# Auto-detect kernel/initrd from /boot
sudo ./build.sh --output rescue.efi

# Explicit paths
sudo ./build.sh \
    --kernel /boot/vmlinuz-linux \
    --initrd /boot/initramfs-linux.img \
    --output rescue.efi

# Build and sign for Secure Boot
sudo ./build.sh --output rescue.efi --sign

# Custom cmdline
sudo ./build.sh --output rescue.efi --cmdline "rd.break console=tty0"
```

## Comparison with builders/uki/

| | uki (mkosi) | uki-lite |
|---|---|---|
| Build tool | mkosi + systemd-ukify | efi-mkuki or objcopy |
| Dependencies | Heavy (mkosi, systemd) | Minimal (binutils) |
| Builds rootfs | Yes (full Arch image) | No (uses host kernel/initrd) |
| Output | Self-contained rescue UKI | UKI from existing boot files |
| Use case | Standalone rescue image | Quick UKI from installed system |
