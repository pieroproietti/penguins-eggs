# Build Infrastructure Plugins

Reproducible, verified, snapshot-based ISO builds.

## Plugins

| Plugin | Project | Status |
|---|---|---|
| st-output | system-transparency | Planned |
| btrfs-snapshot | BtrFsGit | Planned |

## st-output

Produce System Transparency compatible boot artifacts. Signed OS images
with Ed25519 keys, ST descriptors, and hash verification. Machines can
boot eggs-produced images via ST stboot.

## btrfs-snapshot

Git-like snapshots of system state before/after `eggs produce`. Requires
BTRFS filesystem. Graceful no-op on other filesystems. Supports rollback
if build fails.
