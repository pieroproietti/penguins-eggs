# penguins-eggs-integrations

Integration framework extending [Penguins-Eggs](https://github.com/pieroproietti/penguins-eggs)
with 31 git-based projects across 6 feature domains.

## Feature Domains

| Domain | Purpose | Key Projects |
|---|---|---|
| Distribution | ISO hosting & versioning | git-lfs, giftless, gogs |
| Decentralized | P2P ISO distribution via IPFS | brig, git-lfs-ipfs, ipgit |
| Config Management | Versioned wardrobe editing | presslabs/gitfs, dsxack/gitfs |
| Build Infrastructure | Reproducible, verified builds | system-transparency, BtrFsGit |
| Dev Workflow | CI/CD, security, automation | gitstream, frogbot, workflow-ts |
| Packaging | Installation & app distribution | gitpack, github-paser |

## Documents

- [ARCHITECTURE.md](ARCHITECTURE.md) — System design and project mapping
- [INTEGRATION-SPEC.md](INTEGRATION-SPEC.md) — Per-integration specifications with CLI, config, and acceptance criteria
- [PROJECT-CATALOG.md](PROJECT-CATALOG.md) — All 31 projects with descriptions and links

## Implementation Phases

1. **Foundation** — git-lfs, gitpack, release downloader, selective wardrobe download
2. **Decentralized** — brig, git-lfs-ipfs, ipgit, git-ipfs-rehost
3. **Config Management** — gitfs variants, wardrobe merge tools
4. **Build Infrastructure** — system-transparency, BtrFsGit snapshots
5. **Dev Workflow** — gitstream, frogbot, TypeScript CI, developer tools
6. **Self-Hosted** — gogs registry, opengist sharing, giftless server

## File Inventory

46 files total: 26 TypeScript modules, 6 shell scripts, 5 YAML configs, 4 docs, 5 other.

## Structure

```
penguins-eggs-integrations/
├── README.md
├── ARCHITECTURE.md
├── INTEGRATION-SPEC.md
├── PROJECT-CATALOG.md
└── plugins/
    ├── distribution/
    │   ├── lfs-tracker/          # git-lfs ISO tracking + produce hook
    │   ├── gogs-registry/        # Docker Compose self-hosted registry
    │   └── opengist-sharing/     # wardrobe share/import via gists
    ├── decentralized/
    │   ├── brig-publish/         # IPFS distribution via brig
    │   ├── lfs-ipfs/             # git-lfs-ipfs transfer agent setup
    │   ├── ipfs-mirror/          # CI-driven IPFS repo mirroring
    │   └── ipgit-remote/         # git remote backed by IPFS
    ├── config-management/
    │   ├── wardrobe-mount/       # FUSE mount with auto-commit (gitfs)
    │   ├── wardrobe-browse/      # read-only revision browser
    │   ├── wardrobe-merge/       # merge multiple wardrobe repos
    │   └── wardrobe-read/        # programmatic API for wardrobe access
    ├── build-infra/
    │   ├── st-output/            # System Transparency boot artifacts
    │   └── btrfs-snapshot/       # BTRFS snapshots around produce
    ├── dev-workflow/
    │   ├── pr-automation/        # gitStream rules (.cm)
    │   ├── security-scan/        # Frogbot GitHub Action
    │   ├── ts-ci/                # TypeScript-defined CI workflows
    │   └── dev-tools/            # developer costume (lazygit, etc.)
    └── packaging/
        ├── gitpack-install/      # .install/ for gitpack support
        ├── release-downloader/   # shell + oclif release downloader
        └── dir-downloader/       # selective wardrobe directory download
```
