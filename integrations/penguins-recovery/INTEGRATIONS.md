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

## Audit & Security (`integration/audit/`)

Opt-in post-build steps adapted from [penguins-eggs-audit](https://github.com/Interested-Deving-1896/penguins-eggs-audit).
All four fail gracefully when the required binary is absent.

| Module | Upstream | When to run | Purpose |
|---|---|---|---|
| `integration/audit/os-hardening.ts` | [Opsek/OSs-security](https://github.com/Opsek/OSs-security) | Before ISO packaging | Harden the recovery chroot |
| `integration/audit/syft-generate.ts` | [anchore/syft](https://github.com/anchore/syft) | After ISO build | Generate SBOM for the recovery ISO |
| `integration/audit/grant-license.ts` | [anchore/grant](https://github.com/anchore/grant) | After SBOM generation | Check license compliance |
| `integration/audit/vouch-attest.ts` | [mitchellh/vouch](https://github.com/mitchellh/vouch) | After ISO build | Sign the recovery ISO with an attestation bundle |

```typescript
import { RecoveryHardening, RecoverySyft, RecoveryGrant, RecoveryVouch } from './integration/audit/index.js'

// 1. Harden the chroot before packaging
const hardening = new RecoveryHardening(exec)
await hardening.fetchScripts()
await hardening.applyHardening({ chrootPath: '/var/tmp/recovery-chroot' })

// 2. Generate SBOM after ISO build
const syft = new RecoverySyft(exec)
const sbom = await syft.generate('recovery.iso', { outputDir: 'recovery.iso.d' })

// 3. Check license compliance
const grant = new RecoveryGrant(exec)
await grant.check(sbom.sbomPath)

// 4. Sign the ISO
const vouch = new RecoveryVouch(exec)
await vouch.attest('recovery.iso', { keyPath: '/etc/keys/recovery.key', outputDir: 'recovery.iso.d' })
```

## AI Advisor (`integration/eggs-ai/`)

Connects the recovery environment to the [eggs-ai](https://github.com/Interested-Deving-1896/eggs-ai)
HTTP API for AI-assisted diagnostics and Q&A during a recovery session.

| File | Use case |
|---|---|
| `integration/eggs-ai/recovery-advisor.sh` | Shell script for recovery terminals (requires only `curl` or `wget`) |
| `integration/eggs-ai/recovery_advisor.py` | Python module: CLI fallback + optional NiceGUI panel |

```bash
# From a recovery terminal
recovery-advisor doctor "system won't boot after kernel update"
recovery-advisor ask "how do I repair a broken GRUB installation?"
```

Requires eggs-ai to be running: `eggs-ai serve`

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
