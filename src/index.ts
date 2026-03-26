/**
 * penguins-eggs-audit
 *
 * Integration plugins extending Penguins-Eggs with 39 git-based projects
 * across 8 feature domains.
 *
 * Usage:
 *   import { LfsTracker } from 'penguins-eggs-audit/distribution'
 *   import { BrigPublisher } from 'penguins-eggs-audit/decentralized'
 *   import { WardrobeMount } from 'penguins-eggs-audit/config-management'
 *   import { StOutput } from 'penguins-eggs-audit/build-infra'
 *   import { generateWorkflows } from 'penguins-eggs-audit/dev-workflow'
 *   import { DirDownloader } from 'penguins-eggs-audit/packaging'
 *   import { VouchAttest, OsHardening, LinuxSuite } from 'penguins-eggs-audit/security-audit'
 *   import { SyftGenerate, GrantLicense, SbomReference } from 'penguins-eggs-audit/sbom'
 *
 * Or import everything:
 *   import * as audit from 'penguins-eggs-audit'
 */

// Distribution
export {
  LfsTracker,
  loadLfsConfig,
  saveLfsConfig,
  lfsAfterProduce,
  OpengistSharing,
} from './distribution/index.js'
export type { ILfsConfig } from './distribution/index.js'

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
  StOutput,
  BtrfsSnapshot,
  btrfsBeforeProduce,
  btrfsAfterProduce,
} from './build-infra/index.js'
export type { StDescriptor, StSignResult, Snapshot } from './build-infra/index.js'

// Dev Workflow
export {
  generateWorkflows,
  ciWorkflow,
  releaseWorkflow,
  isoTestWorkflow,
} from './dev-workflow/index.js'

// Packaging
export { DirDownloader } from './packaging/index.js'
export type { DirDownloadOptions } from './packaging/index.js'

// Security & Audit
export { VouchAttest, OsHardening, LinuxSuite } from './security-audit/index.js'
export type {
  VouchConfig,
  AttestResult,
  TargetOS,
  HardeningOptions,
  HardeningResult,
  InstallResult,
} from './security-audit/index.js'

// SBOM & Supply Chain
export { SyftGenerate, GrantLicense, SbomReference } from './sbom/index.js'
export type {
  SbomFormat,
  SyftConfig,
  SbomResult,
  GrantConfig,
  LicenseCheckResult,
  SbomMetadata,
  AugmentResult,
  EnrichResult,
} from './sbom/index.js'
