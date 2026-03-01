# Penguins-Eggs Integration Specification

## Scope

Integrate 31 git-based projects into Penguins-Eggs across 6 feature domains.
Each integration is specified with: trigger, dependencies, interface, and
acceptance criteria.

---

## Phase 1: Foundation

### 1.1 Git LFS ISO Tracking

**What:** After `eggs produce`, automatically commit the ISO to a git-lfs-enabled repo.

**Dependencies:** git-lfs (client), giftless or lfs-test-server (server)

**Interface:**
```yaml
# /etc/penguins-eggs.d/lfs.yaml
lfs:
  enabled: true
  remote: origin
  server: https://lfs.example.com  # giftless endpoint
  auto_push: true
  track_patterns:
    - "*.iso"
    - "*.img"
```

**CLI:**
```bash
eggs produce --lfs                    # produce + commit to LFS
eggs produce --lfs --remote myremote  # specify remote
```

**Implementation:**
1. Add `lfs.ts` module to eggs `src/lib/`
2. After ISO production, run:
   - `git lfs track "*.iso"` (if not already)
   - `git add -A && git commit -m "eggs: <distro> <version> <date>"`
   - `git push <remote>` (if auto_push)
3. Support giftless server config for cloud backends (S3/GCS/Azure)
4. Support lfs-test-server for local development

**Acceptance:**
- [ ] ISO pointer file committed to repo after `eggs produce --lfs`
- [ ] ISO blob uploaded to configured LFS server
- [ ] `git clone` + `git lfs pull` retrieves the ISO

---

### 1.2 GitPack Support

**What:** Allow installing eggs via `gitpack install pieroproietti/penguins-eggs`.

**Dependencies:** gitpack

**Implementation:**
1. Add `.install/` directory to penguins-eggs repo root:
   ```
   .install/
     install.sh    # copies eggs binary, sets up PATH
     uninstall.sh  # removes eggs binary and configs
     version       # current version tag
   ```
2. `install.sh` detects architecture, downloads appropriate binary/package
3. `uninstall.sh` cleans up

**Acceptance:**
- [ ] `gitpack install pieroproietti/penguins-eggs` installs eggs
- [ ] `gitpack uninstall pieroproietti/penguins-eggs` removes eggs
- [ ] `gitpack update pieroproietti/penguins-eggs` updates to latest

---

### 1.3 GitHub Release Downloader

**What:** Use Github-paser to download eggs releases.

**Dependencies:** Github-paser (github-parser.sh)

**Implementation:**
1. Document usage: `github-parser.sh pieroproietti/penguins-eggs`
2. Optionally bundle github-parser.sh in eggs repo under `scripts/`
3. Add `eggs download` command that wraps the parser

**CLI:**
```bash
eggs download --latest          # download latest release for current arch
eggs download --version 10.0.0  # specific version
```

**Acceptance:**
- [ ] Downloads correct .deb/.rpm/.appimage for current system
- [ ] Verifies checksum if available

---

### 1.4 Selective Wardrobe Download

**What:** Download specific wardrobe directories without cloning the full repo.

**Dependencies:** github-directory-downloader

**Implementation:**
1. Add `eggs wardrobe get` subcommand
2. Uses github-directory-downloader API to fetch only the requested costume
3. Places files in local wardrobe directory

**CLI:**
```bash
eggs wardrobe get https://github.com/pieroproietti/penguins-wardrobe/tree/main/costumes/colibri
eggs wardrobe get <repo-url>/costumes/<name> --dest /path/to/local/wardrobe
```

**Acceptance:**
- [ ] Downloads only the specified directory
- [ ] Works without git clone of full repo
- [ ] Integrates with existing wardrobe structure

---

## Phase 2: Decentralized Distribution

### 2.1 Brig Integration

**What:** Publish and retrieve eggs ISOs via brig (IPFS with versioning).

**Dependencies:** brig daemon running

**Interface:**
```yaml
# /etc/penguins-eggs.d/ipfs.yaml
ipfs:
  backend: brig  # or raw-ipfs
  auto_publish: true
  encrypt: true
  pin_services:
    - pinata
    - infura
```

**CLI:**
```bash
eggs produce --ipfs                # produce + publish to brig
eggs ipfs publish <iso-path>       # publish existing ISO
eggs ipfs get <cid> --dest /tmp/   # retrieve ISO by CID
eggs ipfs list                     # list published ISOs
```

**Implementation:**
1. Add `ipfs.ts` module to eggs `src/lib/`
2. After ISO production:
   - `brig stage <iso-path>`
   - `brig commit "eggs: <distro> <version>"`
   - `brig push` (to configured remote)
3. Record CID in build metadata
4. Support `brig gateway` for HTTP access

**Acceptance:**
- [ ] ISO available via `brig get` after publish
- [ ] CID recorded in build output
- [ ] HTTP gateway serves ISO for browser download

---

### 2.2 Git-LFS-IPFS Transfer Agent

**What:** Use IPFS as the storage backend for git-lfs tracked ISOs.

**Dependencies:** git-lfs-ipfs (Rust binary), IPFS daemon

**Implementation:**
1. Document ~/.gitconfig setup for git-lfs-ipfs
2. Add `eggs lfs setup --ipfs` command that configures the transfer agent
3. After setup, normal `eggs produce --lfs` stores blobs on IPFS

**Acceptance:**
- [ ] `git lfs push` stores ISO on IPFS
- [ ] `git lfs pull` retrieves ISO from IPFS
- [ ] Works with standard git clone workflow

---

### 2.3 Source Code IPFS Mirror

**What:** Mirror eggs source repo to IPFS.

**Dependencies:** git-ipfs-rehost, ipgit

**Implementation:**
1. CI job runs `git-ipfs-rehost` on each release
2. Publishes IPFS CID to release notes
3. ipgit endpoint for push/clone via standard git

**Acceptance:**
- [ ] `git clone <ipgit-url>/<cid>` clones eggs repo from IPFS
- [ ] CI publishes CID on each release

---

## Phase 3: Configuration Management

### 3.1 Auto-Versioned Wardrobe Editing

**What:** Mount wardrobe repos via FUSE; edits auto-commit.

**Dependencies:** presslabs/gitfs (Python, FUSE)

**CLI:**
```bash
eggs wardrobe mount <repo-url> <mountpoint>
  # Mounts repo via gitfs
  # Any file changes auto-commit and push

eggs wardrobe unmount <mountpoint>
```

**Implementation:**
1. Wrap `gitfs` mount command in eggs CLI
2. Configure auto-commit interval, branch, remote
3. Support presslabs/gitfs-builder for Debian packaging

**Acceptance:**
- [ ] Editing a file in mounted wardrobe creates a git commit
- [ ] Changes push to remote automatically
- [ ] Multiple users can collaborate on wardrobe

---

### 3.2 Wardrobe Revision Browser

**What:** Browse wardrobe history as directories (by tag, branch, commit).

**Dependencies:** dsxack/gitfs or jmillikin/gitfs or centic9/JGitFS

**CLI:**
```bash
eggs wardrobe browse <repo-url> <mountpoint>
  # Mounts read-only with by-tag/, by-branch/, by-commit/ directories

ls <mountpoint>/by-tag/v1.0/costumes/colibri/
```

**Implementation:**
1. Detect available gitfs implementation (Go, Rust, or Java)
2. Mount with appropriate backend
3. Expose all revisions as navigable directories

**Acceptance:**
- [ ] Can browse any historical version of a wardrobe costume
- [ ] Read-only — no accidental modifications
- [ ] Works with local and remote repos

---

### 3.3 Wardrobe Repo Merging

**What:** Consolidate multiple wardrobe repos into one.

**Dependencies:** robinst/git-merge-repos or swingbit/mergeGitRepos

**CLI:**
```bash
eggs wardrobe merge \
  https://github.com/user1/wardrobe \
  https://github.com/user2/wardrobe \
  --into ./merged-wardrobe
```

**Implementation:**
1. Clone source repos
2. Use git-merge-repos to merge preserving history
3. Each source becomes a subdirectory
4. Map branches across repos

**Acceptance:**
- [ ] Merged repo contains all costumes from all sources
- [ ] Git history preserved for each costume
- [ ] Tags and branches mapped correctly

---

## Phase 4: Build Infrastructure

### 4.1 System Transparency Compatible Output

**What:** Produce ST-compatible signed boot artifacts.

**Dependencies:** system-transparency tooling

**CLI:**
```bash
eggs produce --st-sign --key /path/to/key
```

**Implementation:**
1. After ISO production, generate ST OS package:
   - Kernel + initramfs + root filesystem
   - ST descriptor JSON
   - Ed25519 signature
2. Upload to ST provisioning server or HTTPS endpoint
3. Machines boot via ST stboot, fetch and verify eggs-produced image

**Acceptance:**
- [ ] Produced artifact boots via ST stboot
- [ ] Signature verification passes
- [ ] Descriptor includes correct hashes

---

### 4.2 BTRFS Snapshot Integration

**What:** Git-like snapshots of system state around ISO production.

**Dependencies:** koo5/BtrFsGit, BTRFS filesystem

**CLI:**
```bash
eggs produce --snapshot
  # 1. bfg commit "pre-produce"
  # 2. eggs produce (normal)
  # 3. bfg commit "post-produce: <iso-name>"

eggs snapshot list        # list snapshots
eggs snapshot rollback <id>  # restore pre-produce state
```

**Implementation:**
1. Detect if root is BTRFS
2. Use BtrFsGit to create named snapshots
3. Tag snapshots with ISO metadata
4. Support rollback if build fails

**Acceptance:**
- [ ] Snapshot created before and after ISO production
- [ ] Rollback restores system to pre-produce state
- [ ] Works only on BTRFS (graceful skip on other filesystems)

---

## Phase 5: Development Workflow

### 5.1 gitStream PR Automation

**What:** Automate eggs repo PR workflows.

**Dependencies:** linear-b/gitstream (GitHub App)

**Implementation:**
Create `.cm/gitstream.cm`:
```yaml
automations:
  label_wardrobe:
    if: {{ files | match(regex=r/wardrobe\//) | some }}
    run:
      - action: add-label@v1
        args: { label: "wardrobe" }

  label_packaging:
    if: {{ files | match(regex=r/packaging\//) | some }}
    run:
      - action: add-label@v1
        args: { label: "packaging" }

  auto_merge_docs:
    if:
      - {{ files | allDocs }}
      - {{ approvals.approved | length >= 1 }}
    run:
      - action: merge@v1

  assign_distro_maintainer:
    if: {{ files | match(regex=r/conf\/(debian|ubuntu|arch)/) | some }}
    run:
      - action: add-reviewers@v1
        args: { reviewers: ["distro-team"] }
```

**Acceptance:**
- [ ] PRs auto-labeled by changed paths
- [ ] Docs-only PRs auto-merge after 1 approval
- [ ] Distro-specific changes assigned to maintainers

---

### 5.2 Security Scanning

**What:** Scan eggs dependencies for vulnerabilities.

**Dependencies:** jfrog/frogbot

**Implementation:**
1. Add frogbot GitHub Action to eggs CI
2. Scans package.json dependencies
3. Comments on PRs with vulnerability reports
4. Creates fix PRs for known CVEs

**Acceptance:**
- [ ] Frogbot comments on PRs with new vulnerabilities
- [ ] Periodic repo scan creates fix PRs

---

### 5.3 TypeScript CI/CD

**What:** Define eggs CI pipelines in TypeScript.

**Dependencies:** emmanuelnk/github-actions-workflow-ts (primary)

**Implementation:**
1. Create `workflows/` directory with TypeScript workflow definitions
2. Compile to `.github/workflows/*.yml`
3. Workflows: build, test, produce-iso, security-scan, release

**Acceptance:**
- [ ] CI YAML generated from TypeScript source
- [ ] Type errors caught at compile time
- [ ] All existing CI functionality preserved

---

### 5.4 Developer Tools in ISO

**What:** Include git developer tools in eggs-produced developer distros.

**Dependencies:** lazygit, git-insight, git-swift

**Implementation:**
1. Create `costumes/developer` wardrobe entry
2. Include: lazygit, git-insight, git-swift
3. Pre-configure with sensible defaults

**Acceptance:**
- [ ] Developer costume installs all three tools
- [ ] Tools available on PATH after installation

---

## Phase 6: Self-Hosted Ecosystem

### 6.1 Gogs as ISO Registry

**What:** Self-hosted git service for private eggs distribution.

**Dependencies:** gogs/gogs + git-lfs

**Implementation:**
1. Document Gogs setup with LFS enabled
2. Provide Docker Compose for gogs + giftless
3. eggs CLI supports gogs as remote

**Acceptance:**
- [ ] Push ISOs to private Gogs instance via LFS
- [ ] Clone + pull ISOs from Gogs
- [ ] Web UI shows ISO releases

---

### 6.2 Opengist Config Sharing

**What:** Community platform for sharing eggs configurations.

**Dependencies:** thomiceli/opengist

**Implementation:**
1. Document opengist setup for eggs community
2. Add `eggs wardrobe share` command that creates a gist
3. Add `eggs wardrobe import` command that pulls from gist

**CLI:**
```bash
eggs wardrobe share ./costumes/my-custom --server https://gist.example.com
eggs wardrobe import https://gist.example.com/abc123
```

**Acceptance:**
- [ ] Costume configs shareable as git-backed gists
- [ ] Import creates local wardrobe entry
- [ ] Gists are git repos — full version history

---

## Dependency Matrix

| Phase | Hard Dependencies | Optional Dependencies |
|---|---|---|
| 1 | git-lfs, git | giftless, lfs-test-server, gitpack |
| 2 | IPFS daemon | brig, git-lfs-ipfs, ipgit |
| 3 | FUSE (libfuse2/3) | presslabs/gitfs, dsxack/gitfs |
| 4 | — | system-transparency, BtrFsGit (BTRFS only) |
| 5 | GitHub account | gitstream, frogbot, workflow-ts |
| 6 | Docker (for hosting) | gogs, opengist, giftless |

## Risk Assessment

| Risk | Mitigation |
|---|---|
| presslabs/gitfs is unmaintained (~2019) | Fall back to dsxack/gitfs (active, Go-based) |
| IPFS retrieval speed for multi-GB ISOs | Use brig with local caching; offer HTTP gateway fallback |
| BtrFsGit requires BTRFS | Detect filesystem; graceful no-op on ext4/xfs |
| system-transparency is niche | Make ST output optional; standard ISO remains default |
| Too many optional dependencies | Each integration is a plugin; none required for core eggs |
