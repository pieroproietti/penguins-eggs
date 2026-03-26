/**
 * Build infrastructure plugins — reproducible, verified builds.
 */

export { StOutput } from '../../plugins/build-infra/st-output/st-output.js'
export type { StDescriptor, StSignResult } from '../../plugins/build-infra/st-output/st-output.js'

export { BtrfsSnapshot } from '../../plugins/build-infra/btrfs-snapshot/btrfs-snapshot.js'
export type { Snapshot } from '../../plugins/build-infra/btrfs-snapshot/btrfs-snapshot.js'
export {
  beforeProduce as btrfsBeforeProduce,
  afterProduce as btrfsAfterProduce,
} from '../../plugins/build-infra/btrfs-snapshot/produce-hook.js'

// DwarFS — high-compression FUSE filesystem (mhx/dwarfs)
export { DwarfsCompress } from '../../plugins/build-infra/dwarfs-compress/dwarfs-compress.js'
export type {
  DwarfsOptions,
  DwarfsResult,
  DwarfsCompressor,
} from '../../plugins/build-infra/dwarfs-compress/dwarfs-compress.js'
export {
  dwarfsCompress,
  dwarfsVerify,
} from '../../plugins/build-infra/dwarfs-compress/produce-hook.js'

// EROFS — kernel-native read-only compressed filesystem (erofs/erofs-utils)
export { ErofsCompress } from '../../plugins/build-infra/erofs-compress/erofs-compress.js'
export type {
  ErofsOptions,
  ErofsResult,
  ErofsCompressor,
} from '../../plugins/build-infra/erofs-compress/erofs-compress.js'
export {
  erofsCompress,
  erofsVerify,
} from '../../plugins/build-infra/erofs-compress/produce-hook.js'

// fuse-overlayfs — rootless overlay filesystem (containers/fuse-overlayfs)
export { FuseOverlayfs } from '../../plugins/build-infra/fuse-overlayfs/fuse-overlayfs.js'
export type {
  OverlayMount,
  FuseOverlayfsOptions,
} from '../../plugins/build-infra/fuse-overlayfs/fuse-overlayfs.js'
export {
  withOverlayRootfs,
  checkOverlaySupport,
} from '../../plugins/build-infra/fuse-overlayfs/produce-hook.js'

// verity-squash — dm-verity + SquashFS + Secure Boot UKI (brandsimon/verity-squash-root)
export { VeritySquash } from '../../plugins/build-infra/verity-squash/verity-squash.js'
export type {
  VeritySquashOptions,
  VerityBuildResult,
  VerityKeyPair,
} from '../../plugins/build-infra/verity-squash/verity-squash.js'
export {
  veritySignIso,
  verityInit,
} from '../../plugins/build-infra/verity-squash/produce-hook.js'

// go-dmverity — dm-verity hash tree generation (containerd/go-dmverity)
export { GoDmverity } from '../../plugins/build-infra/go-dmverity/go-dmverity.js'
export type {
  VerityOptions,
  VerityResult,
  VerityHashAlgo,
  VerityFormat,
} from '../../plugins/build-infra/go-dmverity/go-dmverity.js'
export {
  dmverityAfterProduce,
  dmverityVerify,
} from '../../plugins/build-infra/go-dmverity/produce-hook.js'

// btrfs-compat — Btrfs kernel feature compatibility (kdave/btrfs-devel)
export { BtrfsCompat } from '../../plugins/build-infra/btrfs-compat/btrfs-compat.js'
export type {
  KernelVersion,
  BtrfsFeatureSet,
  BtrfsMountOptions,
} from '../../plugins/build-infra/btrfs-compat/btrfs-compat.js'
export {
  btrfsCompatCheck,
  btrfsCompatReport,
} from '../../plugins/build-infra/btrfs-compat/produce-hook.js'
