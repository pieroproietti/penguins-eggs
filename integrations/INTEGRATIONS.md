# penguins-eggs integrations

Integration plugins extending penguins-eggs with external projects across 6 domains.

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

## Dev Workflow (`dev-workflow`)

| Plugin | Upstream | Purpose |
|---|---|---|
| `ts-ci` | [nicolo-ribaudo/ts-ci](https://github.com/nicolo-ribaudo/ts-ci) | TypeScript CI workflow generation |
| `security-scan` | [Vijay-Kishore-A/Project-VerityOps](https://github.com/Vijay-Kishore-A/Project-VerityOps) | SAST, SBOM, CVE scanning, dm-verity tamper-detection CI |

---

## Compression backend selection

Three compression backends are available for `eggs produce`:

| Backend | Tool | Ratio | Mount speed | Kernel support | Overlayfs lower |
|---|---|---|---|---|---|
| SquashFS (default) | `mksquashfs` | ~3x | fast | all | no |
| DwarFS | `mkdwarfs` | up to 16x | ~24ms | FUSE | no |
| EROFS | `mkfs.erofs` | ~2-4x | very fast | >= 5.4 (native) | **yes** |

EROFS is the only backend that supports being used as an overlayfs lower layer,
enabling writable live sessions without a separate tmpfs overlay.

## dm-verity pipeline

Two levels of dm-verity integration are available:

| Plugin | Scope | UKI signing | A/B slots |
|---|---|---|---|
| `go-dmverity` | Hash tree only | no | no |
| `verity-squash` | Hash tree + UKI + Secure Boot | yes (sbsign) | yes |

Use `go-dmverity` when you only need tamper detection. Use `verity-squash` for
a full Secure Boot chain of trust.

## Rootless builds

`fuse-overlayfs` enables `eggs produce` to run inside rootless containers
(Podman, Docker `--user`, CI runners) where kernel overlayfs is unavailable.
It is a transparent fallback — when kernel overlayfs is available, it is used
directly with no overhead.

## Usage

```typescript
import {
  dwarfsCompress,
  erofsCompress,
  withOverlayRootfs,
  veritySignIso,
  dmverityAfterProduce,
  btrfsCompatCheck,
  VerityOpsPipeline,
} from 'penguins-eggs-integrations'

// Compress rootfs with DwarFS instead of SquashFS
const result = await dwarfsCompress(rootfsDir, '/tmp/filesystem.dwarfs', exec, verbose)

// Or with EROFS
const result = await erofsCompress(rootfsDir, '/tmp/filesystem.erofs', exec, verbose)

// Rootless build via fuse-overlayfs
await withOverlayRootfs(sourceRootfs, workDir, exec, verbose, async (mergedPath) => {
  await mksquashfs(mergedPath, outputSquashfs)
})

// Add dm-verity hash tree to any filesystem image
const verity = await dmverityAfterProduce('/tmp/filesystem.squashfs', exec, verbose)
console.log(verity.rootHash)

// Full Secure Boot signing pipeline
await veritySignIso('/tmp/filesystem.squashfs', '/boot/efi', '/etc/keys/db.key', exec, verbose)

// Btrfs compatibility check before snapshot operations
await btrfsCompatCheck(exec, verbose)

// Generate security CI workflow
const pipeline = new VerityOpsPipeline(exec, verbose, { sourceDir: '.' })
pipeline.writeCiWorkflow('.')
```
