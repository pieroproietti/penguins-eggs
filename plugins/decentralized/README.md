# Decentralized Distribution Plugins

P2P ISO distribution via IPFS.

## Plugins

| Plugin | Project | Status |
|---|---|---|
| brig-publish | sahib/brig | Planned |
| lfs-ipfs | sameer/git-lfs-ipfs | Planned |
| ipfs-mirror | whyrusleeping/git-ipfs-rehost | Planned |
| ipgit-remote | meyer1994/ipgit | Planned |

## brig-publish

Primary IPFS distribution channel. Publishes ISOs to brig with versioning,
encryption, and HTTP gateway access.

## lfs-ipfs

Transparent IPFS backend for git-lfs. Standard `git push` stores ISO blobs
on IPFS instead of a central server.

## ipfs-mirror

Mirrors eggs source repo to IPFS on each release. CI-driven.

## ipgit-remote

Git remote endpoint backed by IPFS. Push wardrobe repos via standard git.
