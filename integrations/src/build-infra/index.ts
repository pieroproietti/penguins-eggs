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

// mkosi — bespoke OS disk image builder (systemd/mkosi)
export { Mkosi } from '../../plugins/build-infra/mkosi/mkosi.js'
export type {
  MkosiConfig,
  MkosiResult,
  MkosiFormat,
  MkosiDistribution,
} from '../../plugins/build-infra/mkosi/mkosi.js'
export {
  mkosiPrepareRootfs,
  mkosiWrapUki,
} from '../../plugins/build-infra/mkosi/produce-hook.js'

// buildroot — embedded Linux build system (buildroot/buildroot)
export { Buildroot } from '../../plugins/build-infra/buildroot/buildroot.js'
export type {
  BuildrootConfig,
  BuildrootResult,
  BuildrootOutputFormat,
} from '../../plugins/build-infra/buildroot/buildroot.js'
export {
  buildrootPrepareRootfs,
} from '../../plugins/build-infra/buildroot/produce-hook.js'

// embiggen-disk — live partition resize (bradfitz/embiggen-disk)
export { EmbiggenDisk } from '../../plugins/build-infra/embiggen-disk/embiggen-disk.js'
export type {
  EmbiggenOptions,
  ResizeResult,
} from '../../plugins/build-infra/embiggen-disk/embiggen-disk.js'
export {
  embiggenAfterInstall,
} from '../../plugins/build-infra/embiggen-disk/produce-hook.js'

// gpt-image — GPT disk image creator (queso-fuego/UEFI-GPT-image-creator)
export { GptImage } from '../../plugins/build-infra/gpt-image/gpt-image.js'
export type {
  GptImageOptions,
  GptImageResult,
} from '../../plugins/build-infra/gpt-image/gpt-image.js'
export {
  gptImageAfterProduce,
} from '../../plugins/build-infra/gpt-image/produce-hook.js'

// partitionfs — rootless partition access (madscientist42/partitionfs)
export { Partitionfs } from '../../plugins/build-infra/partitionfs/partitionfs.js'
export type {
  PartitionMount,
  PartitionfsOptions,
} from '../../plugins/build-infra/partitionfs/partitionfs.js'
export {
  withPartitions,
  checkPartitionSupport,
} from '../../plugins/build-infra/partitionfs/produce-hook.js'

// partymix — MBR disk image assembly (pyx-cvm/partymix)
export { Partymix } from '../../plugins/build-infra/partymix/partymix.js'
export type {
  PartymixOptions,
  PartymixResult,
  PartymixPartition,
  PartymixPartitionType,
} from '../../plugins/build-infra/partymix/partymix.js'
export {
  partymixAfterProduce,
} from '../../plugins/build-infra/partymix/produce-hook.js'
