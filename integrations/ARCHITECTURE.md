# Penguins-Eggs Integration Architecture

## Overview

This document defines how 31 external git-based projects integrate with
Penguins-Eggs to extend its capabilities across six feature domains.

Penguins-Eggs core function: snapshot a running Linux system into a
redistributable live ISO/image.

The integrations extend eggs in these directions:

```
┌─────────────────────────────────────────────────────────────┐
│                    PENGUINS-EGGS CORE                        │
│         (produce ISOs, install systems, wardrobes)           │
└──────┬──────┬──────┬──────┬──────┬──────┬───────────────────┘
       │      │      │      │      │      │
       ▼      ▼      ▼      ▼      ▼      ▼
   ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
   │DISTRO││DECEN-││CONFIG││BUILD ││DEV   ││PACK- │
   │BUTION││TRAL- ││MGMT  ││INFRA ││WORK- ││AGING │
   │      ││IZED  ││      ││      ││FLOW  ││      │
   └──────┘└──────┘└──────┘└──────┘└──────┘└──────┘
```

---

## Domain 1: Distribution & Hosting

Purpose: Get eggs ISOs and source code to users reliably.

| Project | Role | Integration Point |
|---|---|---|
| git-lfs/git-lfs | Track large ISO files in git repos | `eggs produce` post-hook commits ISO pointer to LFS-enabled repo |
| datopian/giftless | Production LFS server with cloud storage backends | Hosts ISO blobs on S3/GCS/Azure behind LFS API |
| git-lfs/lfs-test-server | Local LFS server for testing | Development/CI testing of LFS-based distribution |
| gogs/gogs | Self-hosted git service for private ISO registries | Organizations host private eggs repos + ISO releases |
| thomiceli/opengist | Share eggs config snippets | Community recipe sharing for wardrobe costumes |

### Implementation

```
eggs produce --lfs-push <remote>
  1. Produce ISO as normal
  2. git-lfs track *.iso
  3. git add + commit ISO pointer
  4. git push to giftless-backed remote (or gogs instance)
```

---

## Domain 2: Decentralized Distribution (IPFS)

Purpose: Censorship-resistant, P2P distribution of eggs artifacts.

| Project | Role | Integration Point |
|---|---|---|
| sahib/brig | Full-featured IPFS file sync with versioning, encryption, FUSE | Primary distribution channel — `brig get` for ISOs |
| sameer/git-lfs-ipfs | LFS custom transfer agent storing blobs on IPFS | Transparent IPFS storage for LFS-tracked ISOs |
| whyrusleeping/git-ipfs-rehost | Rehost git repos on IPFS | Mirror eggs source repo to IPFS |
| meyer1994/ipgit | Git remote endpoint backed by IPFS | Push eggs configs/wardrobes to IPFS via standard git |

### Implementation

```
eggs produce --ipfs
  1. Produce ISO
  2. Add ISO to brig repository (versioned, encrypted)
  3. Publish IPFS CID
  4. Optionally pin via pinning service

eggs config --ipfs-push
  1. Push wardrobe repo to ipgit endpoint
  2. Record CID for reproducibility
```

---

## Domain 3: Configuration Management

Purpose: Version-controlled, collaborative distro customization.

| Project | Role | Integration Point |
|---|---|---|
| presslabs/gitfs | FUSE mount git repos; auto-commit changes | Mount wardrobe repos — edits auto-commit |
| presslabs/gitfs-builder | Debian packaging for gitfs | Package gitfs for eggs-based distros |
| dsxack/gitfs | Browse git repo revisions via FUSE | Mount wardrobe history — browse costume versions as directories |
| jmillikin/gitfs | Rust FUSE filesystem for git repos | Alternative gitfs for wardrobe browsing (by tag/branch) |
| centic9/JGitFS | Java FUSE git filesystem | JVM-based alternative for wardrobe browsing |
| forensicanalysis/gitfs | Go io/fs.FS for git repos | Programmatic read access to wardrobe repos from Go tooling |
| gravypod/gitfs | Read-only FUSE+NFS mount for git repos | NFS-shared wardrobe configs across build machines |

### Implementation

```
eggs wardrobe mount <repo-url> <mountpoint>
  - Uses presslabs/gitfs or dsxack/gitfs under the hood
  - Edits to costumes auto-commit
  - Browse historical versions via by-tag/ directories

eggs wardrobe browse <repo-url> <mountpoint>
  - Read-only mount via jmillikin/gitfs or gravypod/gitfs
  - Exposes all branches/tags as directories
```

---

## Domain 4: Build Infrastructure

Purpose: Reproducible, verified, snapshot-based ISO builds.

| Project | Role | Integration Point |
|---|---|---|
| system-transparency/system-transparency | Verified, signed OS boot images | Produce ST-compatible boot artifacts; cryptographic verification |
| koo5/BtrFsGit | Git-like BTRFS snapshot management | Snapshot system state before/after `eggs produce` |
| robinst/git-merge-repos | Merge multiple git repos preserving history | Consolidate wardrobe repos into monorepo |
| swingbit/mergeGitRepos | Python script to merge git repos with branch mapping | Lightweight alternative for wardrobe consolidation |

### Implementation

```
eggs produce --sign --st-compatible
  1. Take BTRFS snapshot (if on BTRFS) via BtrFsGit
  2. Produce ISO
  3. Sign ISO with ST-compatible keys
  4. Generate ST boot descriptor
  5. Commit BTRFS snapshot for rollback

eggs wardrobe merge <repo1> <repo2> ... --into <target>
  - Uses git-merge-repos to consolidate wardrobe repos
```

---

## Domain 5: Development Workflow & CI

Purpose: Automate eggs project development, security, and releases.

| Project | Role | Integration Point |
|---|---|---|
| linear-b/gitstream | PR automation — auto-label, auto-assign, auto-merge | Automate eggs repo PR workflows |
| jfrog/frogbot | Security vulnerability scanning | Scan eggs npm dependencies for CVEs |
| jesseduffield/lazygit | Terminal UI for git | Include in developer-focused eggs distros |
| avimehenwal/git-insight | Terminal git analytics | Analyze eggs repo contribution patterns |
| ddddami/git-swift | Fuzzy branch switcher | Developer convenience tool for eggs contributors |
| emmanuelnk/github-actions-workflow-ts | Write GH Actions in TypeScript | Define eggs CI/CD in TypeScript |
| tsirysndr/fluent-github-actions | Deno-based GH Actions generator | Alternative TS-based CI definition |
| ForbesLindesay/github-actions-workflow-builder | TypeScript GH Actions builder | Another TS-based CI option |

### Implementation

```
.cm/gitstream.cm  — gitStream rules for eggs repo:
  - Auto-label: wardrobe/, src/, packaging/
  - Auto-assign: distro maintainers by path
  - Auto-merge: docs-only PRs

.github/workflows/ — generated from TypeScript:
  - Use github-actions-workflow-ts to define CI
  - Build, test, produce ISO, scan with frogbot

eggs produce --developer-tools
  - Include lazygit, git-insight, git-swift in ISO
```

---

## Domain 6: Package Management & Installation

Purpose: Simplify eggs installation and app distribution within eggs ISOs.

| Project | Role | Integration Point |
|---|---|---|
| dominiksalvet/gitpack | Git-based package manager | Install eggs via `gitpack install pieroproietti/penguins-eggs` |
| RaduAnPlay/Github-paser | Download GitHub releases (.deb/.rpm/.appimage) | Lightweight eggs release downloader |
| Alex313031/github-directory-downloader | Download subdirectories from GitHub | Download specific wardrobe directories without full clone |

### Implementation

```
# Install eggs itself via gitpack
gitpack install pieroproietti/penguins-eggs

# Download latest eggs release
github-parser.sh pieroproietti/penguins-eggs

# Download just a specific wardrobe costume
eggs wardrobe get <repo-url>/path/to/costume
  - Uses github-directory-downloader under the hood
```

---

## Implementation Phases

### Phase 1: Foundation (Distribution + Packaging)
- git-lfs integration for ISO tracking
- gitpack support (.install directory in eggs repo)
- Github-paser as lightweight installer
- github-directory-downloader for selective wardrobe download

### Phase 2: Decentralized Distribution
- brig integration for IPFS-based ISO distribution
- ipgit for wardrobe repo IPFS hosting
- git-lfs-ipfs as LFS transfer agent
- git-ipfs-rehost for source code mirroring

### Phase 3: Configuration Management
- presslabs/gitfs for auto-versioned wardrobe editing
- dsxack/gitfs for revision browsing
- Wardrobe merge tooling (git-merge-repos)

### Phase 4: Build Infrastructure
- system-transparency compatible output
- BtrFsGit snapshot integration
- Signed/verified ISO production

### Phase 5: Development Workflow
- gitstream PR automation
- frogbot security scanning
- TypeScript-based CI (github-actions-workflow-ts)
- Developer tools in ISO (lazygit, git-insight, git-swift)

### Phase 6: Self-Hosted Ecosystem
- gogs as private ISO registry
- opengist for config snippet sharing
- giftless as production LFS server
