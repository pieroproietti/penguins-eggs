/**
 * penguins-eggs-integrations
 *
 * Integration plugins extending Penguins-Eggs with 46 git-based projects
 * across 6 feature domains.
 *
 * Usage:
 *   import { LfsTracker } from 'penguins-eggs-integrations/distribution'
 *   import { BrigPublisher } from 'penguins-eggs-integrations/decentralized'
 *   import { WardrobeMount } from 'penguins-eggs-integrations/config-management'
 *   import { StOutput } from 'penguins-eggs-integrations/build-infra'
 *   import { generateWorkflows } from 'penguins-eggs-integrations/dev-workflow'
 *   import { DirDownloader } from 'penguins-eggs-integrations/packaging'
 *
 * Or import everything:
 *   import * as integrations from 'penguins-eggs-integrations'
 */

// Distribution
export {
  LfsTracker,
  loadLfsConfig,
  saveLfsConfig,
  lfsAfterProduce,
  OpengistSharing,
  // gentoo-installer (jeremypass96/gentoo-installer)
  GentooInstaller,
  gentooStage3Rootfs,
} from './distribution/index.js'
export type {
  ILfsConfig,
  GentooInstallerConfig,
  GentooArch,
  GentooProfile,
  GentooFilesystem,
  GentooDesktop,
  GentooKernel,
  Stage3Info,
  MakeConf,
} from './distribution/index.js'

// Decentralized
export {
  BrigPublisher,
  loadIpfsConfig,
  saveIpfsConfig,
  LfsIpfsSetup,
  IpgitRemote,
} from './decentralized/index.js'
export type { BrigPublishResult, IIpfsConfig } from './decentralized/index.js'

// Config Management
export {
  WardrobeMount,
  WardrobeBrowse,
  WardrobeMerge,
  WardrobeRead,
} from './config-management/index.js'
export type {
  MountOptions,
  GitFsBackend,
  MergeSource,
  WardrobeEntry,
  CostumeInfo,
} from './config-management/index.js'

// Build Infrastructure
export {
  // Existing
  StOutput,
  BtrfsSnapshot,
  btrfsBeforeProduce,
  btrfsAfterProduce,
  // DwarFS (mhx/dwarfs)
  DwarfsCompress,
  dwarfsCompress,
  dwarfsVerify,
  // EROFS (erofs/erofs-utils)
  ErofsCompress,
  erofsCompress,
  erofsVerify,
  // fuse-overlayfs (containers/fuse-overlayfs)
  FuseOverlayfs,
  withOverlayRootfs,
  checkOverlaySupport,
  // verity-squash (brandsimon/verity-squash-root)
  VeritySquash,
  veritySignIso,
  verityInit,
  // go-dmverity (containerd/go-dmverity)
  GoDmverity,
  dmverityAfterProduce,
  dmverityVerify,
  // btrfs-compat (kdave/btrfs-devel)
  BtrfsCompat,
  btrfsCompatCheck,
  btrfsCompatReport,
  // mkosi (systemd/mkosi)
  Mkosi,
  mkosiPrepareRootfs,
  mkosiWrapUki,
  // buildroot (buildroot/buildroot)
  Buildroot,
  buildrootPrepareRootfs,
  // embiggen-disk (bradfitz/embiggen-disk)
  EmbiggenDisk,
  embiggenAfterInstall,
  // gpt-image (queso-fuego/UEFI-GPT-image-creator)
  GptImage,
  gptImageAfterProduce,
  // partitionfs (madscientist42/partitionfs)
  Partitionfs,
  withPartitions,
  checkPartitionSupport,
  // partymix (pyx-cvm/partymix)
  Partymix,
  partymixAfterProduce,
} from './build-infra/index.js'
export type {
  StDescriptor,
  StSignResult,
  Snapshot,
  DwarfsOptions,
  DwarfsResult,
  DwarfsCompressor,
  ErofsOptions,
  ErofsResult,
  ErofsCompressor,
  OverlayMount,
  FuseOverlayfsOptions,
  VeritySquashOptions,
  VerityBuildResult,
  VerityKeyPair,
  VerityOptions,
  VerityResult,
  VerityHashAlgo,
  VerityFormat,
  KernelVersion,
  BtrfsFeatureSet,
  BtrfsMountOptions,
  MkosiConfig,
  MkosiResult,
  MkosiFormat,
  MkosiDistribution,
  BuildrootConfig,
  BuildrootResult,
  BuildrootOutputFormat,
  EmbiggenOptions,
  ResizeResult,
  GptImageOptions,
  GptImageResult,
  PartitionMount,
  PartitionfsOptions,
  PartymixOptions,
  PartymixResult,
  PartymixPartition,
  PartymixPartitionType,
} from './build-infra/index.js'

// Dev Workflow
export {
  generateWorkflows,
  ciWorkflow,
  releaseWorkflow,
  isoTestWorkflow,
  // verity-ops-pipeline (Vijay-Kishore-A/Project-VerityOps)
  VerityOpsPipeline,
} from './dev-workflow/index.js'
export type {
  SecurityScanOptions,
  SbomResult,
  CveResult,
  TamperTestResult,
} from './dev-workflow/index.js'

// Packaging
export { DirDownloader } from './packaging/index.js'
export type { DirDownloadOptions } from './packaging/index.js'
