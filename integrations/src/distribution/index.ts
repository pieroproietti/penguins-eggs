/**
 * Distribution plugins — ISO hosting, versioning, and centralized distribution.
 */

export { LfsTracker } from '../../plugins/distribution/lfs-tracker/lfs-tracker.js'
export { loadLfsConfig, saveLfsConfig } from '../../plugins/distribution/lfs-tracker/lfs-config.js'
export type { ILfsConfig } from '../../plugins/distribution/lfs-tracker/lfs-config.js'
export { afterProduce as lfsAfterProduce } from '../../plugins/distribution/lfs-tracker/produce-hook.js'
export { OpengistSharing } from '../../plugins/distribution/opengist-sharing/opengist-sharing.js'

// gentoo-installer — Gentoo Stage3 rootfs + installer (jeremypass96/gentoo-installer)
export { GentooInstaller } from '../../plugins/distribution/gentoo-installer/gentoo-installer.js'
export type {
  GentooInstallerConfig,
  GentooArch,
  GentooProfile,
  GentooFilesystem,
  GentooDesktop,
  GentooKernel,
  Stage3Info,
  MakeConf,
} from '../../plugins/distribution/gentoo-installer/gentoo-installer.js'
export {
  gentooStage3Rootfs,
} from '../../plugins/distribution/gentoo-installer/produce-hook.js'
