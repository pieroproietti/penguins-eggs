/**
 * Decentralized distribution plugins — P2P ISO distribution via IPFS.
 */

export { BrigPublisher } from '../../plugins/decentralized/brig-publish/brig-publisher.js'
export type { BrigPublishResult } from '../../plugins/decentralized/brig-publish/brig-publisher.js'
export { loadIpfsConfig, saveIpfsConfig } from '../../plugins/decentralized/brig-publish/ipfs-config.js'
export type { IIpfsConfig } from '../../plugins/decentralized/brig-publish/ipfs-config.js'
export { LfsIpfsSetup } from '../../plugins/decentralized/lfs-ipfs/lfs-ipfs-setup.js'
export { IpgitRemote } from '../../plugins/decentralized/ipgit-remote/ipgit-remote.js'
