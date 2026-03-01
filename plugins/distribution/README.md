# Distribution Plugins

ISO hosting, versioning, and centralized distribution.

## Plugins

| Plugin | Project | Status |
|---|---|---|
| lfs-tracker | git-lfs + giftless | Planned |
| gogs-registry | gogs | Planned |
| opengist-sharing | opengist | Planned |

## lfs-tracker

Tracks ISOs in git-lfs after `eggs produce`. Supports giftless (S3/GCS/Azure)
and lfs-test-server (local dev) as backends.

## gogs-registry

Self-hosted git service as a private ISO registry. Docker Compose deployment
with LFS enabled.

## opengist-sharing

Share wardrobe costumes as git-backed gists. `eggs wardrobe share` and
`eggs wardrobe import` commands.
