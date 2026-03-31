# Configuration Management Plugins

Version-controlled, collaborative wardrobe editing.

## Plugins

| Plugin | Project(s) | Status |
|---|---|---|
| wardrobe-mount | presslabs/gitfs | Planned |
| wardrobe-browse | dsxack/gitfs, jmillikin/gitfs, JGitFS | Planned |
| wardrobe-merge | git-merge-repos, mergeGitRepos | Planned |
| wardrobe-read | forensicanalysis/gitfs, gravypod/gitfs | Planned |

## wardrobe-mount

FUSE mount with auto-commit. Edits to wardrobe files create git commits
automatically. Uses presslabs/gitfs (with gitfs-builder for Debian packaging).

## wardrobe-browse

Read-only FUSE mount exposing all revisions as directories. Browse any
historical version of a costume by navigating by-tag/ or by-branch/ paths.

## wardrobe-merge

Consolidate multiple wardrobe repos into one, preserving git history.

## wardrobe-read

Programmatic read access to wardrobe repos. Go io/fs.FS interface or
NFS-shared read-only mount for build machines.
