# penguins-recovery integrations

External projects integrated into penguins-recovery builders, adapters, and scripts.

## Builders

| Builder | Upstream integrations | Output |
|---|---|---|
| `builders/debian` | debootstrap, live-build | Debian rescue ISO |
| `builders/arch` | mkarchiso | Arch rescue ISO |
| `builders/uki` | mkosi, systemd-ukify | Signed UKI EFI |
| `builders/uki` (verity) | [systemd/mkosi](https://github.com/systemd/mkosi) `--verity --secure-boot` | dm-verity verified + signed UKI |
| `builders/uki-lite` | objcopy, EFI stub | Lightweight UKI EFI |
| `builders/verity-uki` | [brandsimon/verity-squash-root](https://github.com/brandsimon/verity-squash-root), [containerd/go-dmverity](https://github.com/containerd/go-dmverity) | dm-verity verified + Secure Boot signed UKI |
| `builders/buildroot` | [buildroot/buildroot](https://github.com/buildroot/buildroot) | Cross-compiled recovery image (any arch) |
| `builders/gpt-image` | [queso-fuego/UEFI-GPT-image-creator](https://github.com/queso-fuego/UEFI-GPT-image-creator) | Bootable GPT disk image (UEFI, USB, VM) |
| `builders/mbr-image` | [pyx-cvm/partymix](https://github.com/pyx-cvm/partymix) | Legacy BIOS MBR disk image |
| `builders/lifeboat` | Alpine Linux | Single-file UEFI rescue EFI |
| `builders/rescatux` | live-build, rescapp | Rescatux ISO |

## Adapters

| Adapter | Upstream | Purpose |
|---|---|---|
| `adapters/adapter.sh` | — | Layer recovery tools onto penguins-eggs naked ISOs |
| `adapters/fuse-overlay/` | [containers/fuse-overlayfs](https://github.com/containers/fuse-overlayfs) | Rootless ISO adaptation (no root required) |

## Recovery Scripts

| Script | Upstream | Purpose |
|---|---|---|
| `common/scripts/chroot-rescue.sh` | — | Mount and chroot into installed Linux system |
| `common/scripts/btrfs-rescue.sh` | [kdave/btrfs-devel](https://github.com/kdave/btrfs-devel) | Btrfs subvolume-aware rescue, snapshot rollback |
| `common/scripts/erofs-rescue.sh` | [erofs/erofs-utils](https://github.com/erofs/erofs-utils) | EROFS image check, dump, extract, mount |
| `common/scripts/embiggen-disk.sh` | [bradfitz/embiggen-disk](https://github.com/bradfitz/embiggen-disk) | Live partition resize (expand to fill disk) |
| `common/scripts/detect-disks.sh` | — | Detect and classify storage devices |
| `common/scripts/grub-restore.sh` | — | Restore GRUB bootloader |
| `common/scripts/password-reset.sh` | — | Reset user passwords via chroot |
| `common/scripts/uefi-repair.sh` | — | Repair UEFI boot entries |

---

## Disk image output formats

| Builder | Format | Boot | Use case |
|---|---|---|---|
| `builders/uki` / `verity-uki` | `.efi` (UKI) | UEFI | Modern hardware, Secure Boot |
| `builders/gpt-image` | `.hdd` / `.vhd` | UEFI (GPT) | USB drives, VMs |
| `builders/mbr-image` | `.img` (MBR) | BIOS | Legacy hardware |
| `builders/lifeboat` | `.efi` | UEFI | Minimal single-file |
| `builders/debian` / `arch` | `.iso` | BIOS + UEFI | Universal |

## Quick reference

```bash
# Verified Secure Boot recovery UKI
make verity-uki SIGN=1 KEY=/etc/keys/db.key CERT=/etc/keys/db.crt

# mkosi-based verified UKI (extends builders/uki)
cd builders/uki && ./build-verity.sh --key /etc/keys/db.key --cert /etc/keys/db.crt

# Cross-compiled recovery image (e.g. ARM)
make buildroot BUILDROOT=/opt/buildroot ARCH=aarch64

# GPT disk image for USB/VM (UEFI)
make gpt-image ROOTFS=builders/debian/recovery.squashfs

# MBR disk image for legacy BIOS
make mbr-image ROOTFS=builders/debian/recovery.squashfs

# Rootless ISO adaptation
make adapt-rootless INPUT=naked.iso OUTPUT=recovery.iso

# Btrfs subvolume-aware chroot
make btrfs-rescue CMD=chroot PART=/dev/sda3

# EROFS image check
make erofs-check IMAGE=/path/to/system.erofs

# Expand partition to fill disk
make embiggen DEVICE=/dev/sda1
```
