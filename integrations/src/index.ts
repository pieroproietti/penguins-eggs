/**
 * penguins-eggs-integrations
 *
 * Integration plugins extending Penguins-Eggs with 31 git-based projects
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
