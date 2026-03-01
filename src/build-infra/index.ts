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
