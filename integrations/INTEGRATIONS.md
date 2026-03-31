# penguins-eggs integrations

This file documents all integrations on the `all-features` branch:
**4 ecosystem tools** (full repos merged as subtrees) and **46 plugin
integrations** across 6 domains.

---

## Ecosystem Tools

Full companion repos with bidirectional hooks into `eggs produce`.

| Tool | Directory | Language | Purpose |
|---|---|---|---|
| penguins-recovery | [`penguins-recovery/`](penguins-recovery/) | Shell | Rescue toolkit; adapters for all distro families; standalone builders |
| penguins-powerwash | [`penguins-powerwash/`](penguins-powerwash/) | Shell | Factory reset: soft / medium / hard / sysprep / hardware modes |
| penguins-immutable-framework | [`penguins-immutable-framework/`](penguins-immutable-framework/) | Go + Shell | Immutable distro framework: abroot, ashos, frzr, akshara, btrfs-dwarfs |
| penguins-kernel-manager | [`penguins-kernel-manager/`](penguins-kernel-manager/) | Python | Kernel lifecycle: fetch → patch → compile → install → hold → remove |

### Ecosystem hook events

| Event | penguins-recovery | penguins-powerwash | PIF | PKM |
|---|---|---|---|---|
| `eggs produce` | embeds eggs-plugin hook | embeds binary + GRUB entry | embeds PIF state | embeds kernel list |
| pre-reset | creates snapshot | calls `eggs produce --naked` | exits mutable mode | snapshots kernel state |
| post-reset | — | re-layers recovery tools | re-initialises backend | reinstalls held kernel |
| kernel change | — | — | — | notifies eggs via `eggs kernel-changed` |
| immutable upgrade | creates snapshot | — | notifies eggs via `eggs pif-upgraded` | — |

---

## Plugin Integrations

Total: **46 integrations** across 6 domains.

---

## Build Infrastructure (`build-infra`)

| Plugin | Upstream | Purpose |
|---|---|---|
| `st-output` | [system-transparency/system-transparency](https://github.com/system-transparency/system-transparency) | System Transparency boot artifacts |
| `btrfs-snapshot` | [koo5/BtrFsGit](https://github.com/koo5/BtrFsGit) | Git-like Btrfs snapshots around `eggs produce` |
| `dwarfs-compress` | [mhx/dwarfs](https://github.com/mhx/dwarfs) | High-compression FUSE filesystem as SquashFS alternative |
| `erofs-compress` | [erofs/erofs-utils](https://github.com/erofs/erofs-utils) | Kernel-native read-only compressed filesystem |
| `fuse-overlayfs` | [containers/fuse-overlayfs](https://github.com/containers/fuse-overlayfs) | Rootless overlay filesystem for container builds |
| `verity-squash` | [brandsimon/verity-squash-root](https://github.com/brandsimon/verity-squash-root) | dm-verity + SquashFS + Secure Boot UKI signing |
| `go-dmverity` | [containerd/go-dmverity](https://github.com/containerd/go-dmverity) | dm-verity hash tree generation (Go, veritysetup-compatible) |
| `btrfs-compat` | [kdave/btrfs-devel](https://github.com/kdave/btrfs-devel) | Btrfs kernel feature compatibility gating |
| `mkosi` | [systemd/mkosi](https://github.com/systemd/mkosi) | Bespoke OS disk image builder; base rootfs + UKI pipeline |
| `buildroot` | [buildroot/buildroot](https://github.com/buildroot/buildroot) | Cross-compiled embedded Linux rootfs as eggs source |
| `embiggen-disk` | [bradfitz/embiggen-disk](https://github.com/bradfitz/embiggen-disk) | Live partition + filesystem resize (post-install expansion) |
| `gpt-image` | [queso-fuego/UEFI-GPT-image-creator](https://github.com/queso-fuego/UEFI-GPT-image-creator) | Bootable GPT disk image (UEFI, USB, VM) |
| `partitionfs` | [madscientist42/partitionfs](https://github.com/madscientist42/partitionfs) | Rootless FUSE partition access for disk images |
| `partymix` | [pyx-cvm/partymix](https://github.com/pyx-cvm/partymix) | MBR disk image assembly for legacy BIOS targets |

## Distribution (`distribution`)

| Plugin | Upstream | Purpose |
|---|---|---|
| `lfs-tracker` | [git-lfs/git-lfs](https://github.com/git-lfs/git-lfs) | LFS tracking for large ISO artifacts |
| `opengist-sharing` | [nicholaswilde/opengist](https://github.com/nicholaswilde/opengist) | ISO sharing via self-hosted Gist |
| `gentoo-installer` | [jeremypass96/gentoo-installer](https://github.com/jeremypass96/gentoo-installer) | Gentoo Stage3 rootfs + GPU/CPU-optimized make.conf |

## Dev Workflow (`dev-workflow`)

| Plugin | Upstream | Purpose |
|---|---|---|
| `ts-ci` | [nicolo-ribaudo/ts-ci](https://github.com/nicolo-ribaudo/ts-ci) | TypeScript CI workflow generation |
| `security-scan` | [Vijay-Kishore-A/Project-VerityOps](https://github.com/Vijay-Kishore-A/Project-VerityOps) | SAST, SBOM, CVE scanning, dm-verity tamper-detection CI |

---

## Compression backend selection

| Backend | Tool | Ratio | Mount speed | Kernel support | Overlayfs lower |
|---|---|---|---|---|---|
| SquashFS (default) | `mksquashfs` | ~3x | fast | all | no |
| DwarFS | `mkdwarfs` | up to 16x | ~24ms | FUSE | no |
| EROFS | `mkfs.erofs` | ~2-4x | very fast | >= 5.4 (native) | **yes** |

## Disk image output formats

| Plugin | Format | Boot firmware | Use case |
|---|---|---|---|
| ISO (default) | `.iso` | BIOS + UEFI hybrid | Universal, optical media |
| `gpt-image` | `.hdd` / `.vhd` | UEFI only | USB drives, VMs, modern hardware |
| `partymix` | `.img` | BIOS (MBR) | Legacy hardware, broad compatibility |

## Rootfs source options

| Plugin | Source | Cross-compile | Reproducible |
|---|---|---|---|
| Running system (default) | Live system snapshot | no | no |
| `mkosi` | Distribution packages | no | yes |
| `buildroot` | Source + cross-toolchain | **yes** | yes |
| `gentoo-installer` | Stage3 tarball | no | yes |

## Rootless build pipeline

Complete rootless ISO build (no root required at any step):

```
partitionfs    → expose disk image partitions as files
squashfuse     → mount squashfs rootfs read-only
fuse-overlayfs → overlay for modifications
mksquashfs     → repack (no root needed for squashfs packing)
```

## Usage examples

```typescript
import {
  dwarfsCompress, erofsCompress,
  mkosiPrepareRootfs, buildrootPrepareRootfs, gentooStage3Rootfs,
  gptImageAfterProduce, partymixAfterProduce,
  withOverlayRootfs, withPartitions,
  veritySignIso, dmverityAfterProduce,
  embiggenAfterInstall,
} from 'penguins-eggs-integrations'

// Build a clean Debian base rootfs with mkosi, then compress with EROFS
const rootfsDir = await mkosiPrepareRootfs('/tmp/mkosi-work', exec, verbose, {
  distribution: 'debian', release: 'bookworm',
})
await erofsCompress(rootfsDir, '/tmp/filesystem.erofs', exec, verbose)

// Cross-compiled ARM rootfs via Buildroot
const { path } = await buildrootPrepareRootfs('/opt/buildroot', exec, verbose, {
  arch: 'aarch64', rootfsFormat: 'squashfs',
})

// Gentoo Stage3 with KDE desktop
const gentooRootfs = await gentooStage3Rootfs('/tmp/gentoo', exec, verbose, {
  desktop: 'kde', kernel: 'binary',
})

// Sign with dm-verity + Secure Boot
await veritySignIso('/tmp/filesystem.squashfs', '/boot/efi', '/etc/keys/db.key', exec, verbose)

// GPT disk image for USB/VM
await gptImageAfterProduce('recovery.efi', '/tmp/filesystem.squashfs', 'recovery.hdd', exec, verbose)

// MBR image for legacy BIOS hardware
await partymixAfterProduce('boot.fat32', '/tmp/filesystem.squashfs', 'recovery-mbr.img', exec, verbose)

// Post-install: expand root partition to fill disk
await embiggenAfterInstall('/dev/sda1', exec, verbose)
```
