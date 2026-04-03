# Penguins-Eggs Integration Architecture

## Overview

This document defines how all external projects integrate with Penguins-Eggs
on the `all-features` branch.

Penguins-Eggs core function: snapshot a running Linux system into a
redistributable live ISO/image.

The integrations extend eggs in two layers:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            PENGUINS-EGGS CORE                                    │
│                 (produce ISOs, install systems, wardrobes)                       │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────────────────────┘
   │      │      │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────────┐┌──────────┐
│recov-││power-││immut-││kernel││audit ││eggs- ││eggs- ││distro-   ││incus-    │
│ery   ││wash  ││able  ││-mgr  ││+SBOM ││gui   ││ai    ││builder   ││image-svr │
└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘└──────────┘└──────────┘
   ECOSYSTEM TOOLS (9 subtree repos, bidirectional hooks)

┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│DISTRO││DECEN-││CONFIG││BUILD ││DEV   ││PACK- │
│BUTION││TRAL- ││MGMT  ││INFRA ││WORK- ││AGING │
│      ││IZED  ││      ││      ││FLOW  ││      │
└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘
   PLUGIN INTEGRATIONS (46 lightweight plugins)
```

---

## Ecosystem Tools

### penguins-recovery

**Purpose:** Layer rescue tools onto any penguins-eggs naked ISO; build
standalone rescue images.

**Integration points:**

| Direction | Trigger | Action |
|---|---|---|
| recovery → eggs | `eggs produce` | eggs-plugin embeds recovery hook into ISO |
| eggs → recovery | pre-reset | `penguins-recovery snapshot create <label>` |
| eggs → recovery | post-hard-reset | `adapter.sh` re-layers recovery tools |

**Key components:**
- `adapters/` — distro-family adapters (apt, pacman, dnf, zypper, apk, emerge)
- `builders/` — debian, arch, uki, uki-lite, lifeboat, rescatux
- `gui/` — KDE Plasma Nano: minimal (~200 MB), touch (~400 MB), full (~800 MB)
- `bin/penguins-recovery` — CLI with `snapshot` subcommand
- `tools/rescapp/` — Qt5 GUI rescue wizard

---

### penguins-powerwash

**Purpose:** Factory reset with five modes; pre-reset ISO snapshot; post-reset
recovery re-layer.

**Integration points:**

| Direction | Trigger | Action |
|---|---|---|
| powerwash → eggs | pre-reset (any mode) | `eggs produce --naked` (if `PRE_RESET_EGGS_PRODUCE=1`) |
| powerwash → recovery | pre-reset | `penguins-recovery snapshot create pre-powerwash-<mode>` |
| powerwash → recovery | post-hard/sysprep | `adapter.sh` re-layers recovery tools |
| eggs → powerwash | `eggs produce` | eggs-plugin embeds binary + GRUB "Factory Reset" entry |

**Reset modes:**

| Mode | Dotfiles | Packages | Home | System config | Machine ID |
|---|---|---|---|---|---|
| soft | reset | — | — | — | — |
| medium | reset | purged | — | sources reset | — |
| hard | reset | purged | wiped | reset | — |
| sysprep | — | — | — | reset | cleared |
| hardware | full wipe + firmware reset | | | | |

Config: `/etc/penguins-powerwash/eggs-hooks.conf`

---

### penguins-immutable-framework (PIF)

**Purpose:** Unified CLI and HAL over multiple immutability backends for
building immutable Linux distributions.

**Backends:**

| Backend | Mechanism | Best for |
|---|---|---|
| abroot | A/B partition swap + OCI | Appliance/desktop, atomic OCI updates |
| ashos | BTRFS snapshot tree | Multi-distro, hierarchical snapshots |
| frzr | Read-only BTRFS subvolume | Gaming/appliance, image-based deploy |
| akshara | YAML-declared rebuild | Declarative, container-native distros |
| btrfs-dwarfs | BTRFS + DwarFS hybrid | Storage-constrained, high-compression |

**Integration points:**

| Direction | Trigger | Action |
|---|---|---|
| PIF → recovery | `pif upgrade` (pre) | `penguins-recovery snapshot create pre-pif-upgrade` |
| PIF → eggs | `pif upgrade` (post) | `eggs pif-upgraded` hook — next ISO reflects new root |
| PIF → eggs | `pif mutable enter` | warns eggs to defer ISO builds |
| PIF → eggs | `pif mutable exit` | `eggs produce --update-root` (if `post_mutable_produce=true`) |
| eggs → PIF | `eggs produce` | eggs-plugin embeds PIF config + backend state |
| eggs → PIF | `eggs update` | checks mutable mode before updating |

Config: `pif.toml` `[hooks]` section

---

### penguins-kernel-manager (PKM)

**Purpose:** Full kernel lifecycle across all distros and architectures.

**Kernel sources:** Ubuntu Mainline PPA, XanMod, Liquorix, distro-native,
Gentoo source, local packages, lkf build profiles.

**Integration points:**

| Direction | Trigger | Action |
|---|---|---|
| PKM → recovery | pre-install | `penguins-recovery snapshot create pre-kernel-<version>` |
| PKM → eggs | post-install | `eggs kernel-changed` hook — next ISO reflects new kernel |
| PKM → eggs | pre-remove | warns if kernel is embedded in last ISO |
| eggs → PKM | `eggs produce` | eggs-plugin embeds managed kernel list |
| eggs → PKM | `eggs update` | checks for held kernels before updating |

Config: `/etc/penguins-kernel-manager/hooks.conf`

---

### penguins-eggs-audit

**Purpose:** Security audit, OS hardening, and supply chain transparency for
eggs-produced ISOs. Extends the 6 original plugin domains with two new ones.

**Additional domains:**

| Domain | Key projects | Purpose |
|---|---|---|
| Security & Audit | vouch, OSs-security, ultimate-linux-suite | Cryptographic attestation, OS hardening, vulnerability scanning |
| SBOM & Supply Chain | syft, grant, SBOM-Generation | Software bill of materials, license compliance, CISA reference workflows |

**Integration points:**

| Direction | Trigger | Action |
|---|---|---|
| audit → eggs | `eggs produce` | `syft-generate` plugin creates SBOM for the ISO artifact |
| audit → eggs | `eggs produce` | `vouch-attest` plugin signs the ISO with cryptographic attestation |
| audit → eggs | `eggs produce` | `grant-license` plugin scans ISO contents for license compliance |
| audit → eggs | CI | `os-hardening` plugin applies hardening scripts to the produced system |

**eggs lifecycle wiring (`eggs produce --audit`):**

```
eggs produce --audit [--audit-hardening] [--audit-vouch-key=key.pem]
  │
  ├── (pre-produce, if --audit-hardening)
  │     OsHardening.applyHardening(snapshotDir)
  │       └── fetches Opsek/OSs-security scripts on first run
  │           applies hardening.sh --chroot <snapshotDir>
  │
  └── (post-produce)
        ├── SyftGenerate.generate(isoPath)
        │     mounts ISO loop device → syft dir:<mount> → <name>.sbom.json
        │
        ├── GrantLicense.check(sbomPath)
        │     grant check [--config .grant.yaml] <sbomPath>
        │     writes default .grant.yaml if none exists
        │
        └── VouchAttest.attest(isoPath)  [only if --audit-vouch-key set]
              vouch attest --key <key> --output <name>.attestation.json <iso>
```

**Flags:**

| Flag | Default | Purpose |
|---|---|---|
| `--audit` | — | Enable full audit pipeline |
| `--audit-format` | `spdx-json` | SBOM format (spdx-json, cyclonedx-json, syft-json, spdx-tag-value) |
| `--audit-output` | `/var/lib/eggs/audit` | Output directory for all audit artefacts |
| `--audit-vouch-key` | — | Path to vouch signing key (skips attestation if not set) |
| `--audit-hardening` | — | Apply OS hardening to chroot before ISO assembly |
| `--audit-grant-policy` | auto | Path to `.grant.yaml` license policy |
| `--audit-fail-on-deny` | false | Exit non-zero on license policy violations |

Source: [`penguins-eggs-audit/`](penguins-eggs-audit/) — TypeScript + Shell, 54 files, 8 domains, 39 upstream projects.

---

### eggs-gui

**Purpose:** Unified GUI for penguins-eggs. A single Go daemon exposes all
eggs operations over JSON-RPC on a Unix socket; three frontends connect to it.

**Architecture:**

```
Frontend (TUI / Desktop / Web)
        │
   JSON-RPC over Unix socket (/tmp/eggs-gui.sock)
        │
   eggs-daemon (Go)
        │
   penguins-eggs CLI
```

**Frontends:**

| Frontend | Framework | Language | Use case |
|---|---|---|---|
| TUI | BubbleTea | Go | Terminal / SSH sessions |
| Desktop | NodeGUI (Qt6) | TypeScript | Native desktop with CSS styling |
| Web | NiceGUI | Python | Remote / headless via browser |

**Features:** ISO produce with full option control, AUTO mode, Dad/Tools config
editors, wardrobe browser, Calamares management, PPA/Skel/Yolk tools, USB copy
with progress, i18n (es, en, pt, it).

**eggs lifecycle wiring:**

| Command | Action |
|---|---|
| `eggs gui` | Start daemon + launch TUI (default) |
| `eggs gui --frontend=desktop` | Start daemon + launch NodeGUI desktop |
| `eggs gui --frontend=web` | Start daemon + launch NiceGUI web (port 7777) |
| `eggs gui --daemon-only` | Start daemon only (for external frontends) |
| `eggs gui --stop` | Stop the running daemon |

**Install:** `sudo ./scripts/install-eggs-gui.sh [--desktop] [--web] [--all]`
Installs binaries to `/usr/local/bin/`, registers `eggs-daemon.service` with systemd.
Auto-builds from source on first `eggs gui` if binaries not found (requires Go 1.21+).

Source: [`eggs-gui/`](eggs-gui/) and root [`../eggs-gui/`](../eggs-gui/) — Go + TypeScript + Python.

---

### eggs-ai

**Purpose:** AI assistant for penguins-eggs. Provides diagnostics, guided ISO
building, config generation, and Calamares assistance via multiple LLM backends.

**LLM providers (7 built-in):** Gemini, OpenAI, Anthropic, Mistral, Groq,
Ollama (local), custom (any OpenAI-compatible endpoint).

**Interfaces:**

| Interface | Description |
|---|---|
| CLI | `eggs-ai doctor`, `build`, `config explain/generate`, `calamares`, `ask`, `chat` |
| HTTP API | REST + SSE at `http://127.0.0.1:3737/api/*` |
| MCP server | 10 tools for Cursor, Claude Desktop, opencode, etc. |
| TypeScript SDK | `eggs-ai/sdk` — for eggs-gui NodeGUI desktop integration |
| Python client | `integrations/web/ai_panel.py` — for eggs-gui NiceGUI web frontend |
| Go client | `integrations/tui/ai_client.go` — for eggs-gui BubbleTea TUI |

**MCP tools:** `eggs_doctor`, `eggs_build_plan`, `eggs_config_explain`,
`eggs_config_generate`, `eggs_system_status`, `eggs_command_reference`,
`eggs_troubleshoot`, `eggs_distro_guide`, `eggs_workflow`, `eggs_calamares_info`.

**Integration with eggs-gui:**

```
eggs-gui frontends → HTTP REST → eggs-ai server (port 3737) → LLM provider
eggs-gui daemon    → JSON-RPC  → ai.* methods (via proto/eggs-ai-rpc.json)
```

**eggs lifecycle wiring:**

| Command | Action |
|---|---|
| `eggs ai doctor` | Diagnose eggs environment |
| `eggs ai ask "<q>"` | One-shot question |
| `eggs ai chat` | Interactive session |
| `eggs ai build` | Guided ISO build plan |
| `eggs ai serve` | Start HTTP API on port 3737 |
| `eggs ai mcp` | Start MCP server |
| `eggs ai install` | Install eggs-ai + systemd service |
| `eggs ai providers init` | Generate `~/.eggs-ai.yaml` |

All subcommands are passed through to the `eggs-ai` binary. If not installed,
`eggs ai install` runs the upstream `install.sh` automatically.

Config: `~/.eggs-ai.yaml` (run `eggs ai providers init` to generate).

Source: [`eggs-ai/`](eggs-ai/) and root [`../eggs-ai/`](../eggs-ai/) — TypeScript, 9 test files, 80 tests.

---

### penguins-distrobuilder

**Purpose:** Unified project combining `lxc/distrobuilder` (Go) and
`itoffshore/distrobuilder-menu` (Python TUI) in a single subtree layout,
with penguins-eggs integration hooks.

**Internal layout:**

```
penguins-distrobuilder/
├── distrobuilder/   # lxc/distrobuilder — Go, Apache-2.0
├── menu/            # itoffshore/distrobuilder-menu — Python, GPL-3.0
├── integration/
│   ├── eggs-plugin/distrobuilder-hook.sh
│   └── recovery-plugin/distrobuilder-recovery-hook.sh
└── Makefile
```

**distrobuilder (Go) commands:**

| Command | Purpose |
|---|---|
| `distrobuilder build-incus` | Build Incus image from scratch |
| `distrobuilder build-lxc` | Build LXC image from scratch |
| `distrobuilder build-dir` | Build plain rootfs |
| `distrobuilder pack-incus` | Create Incus image from existing rootfs |
| `distrobuilder pack-lxc` | Create LXC image from existing rootfs |
| `distrobuilder repack-windows` | Repack Windows ISO with drivers |

**distrobuilder-menu (Python) — `dbmenu`:**
Menu-driven LXD/LXC image building with template management, cloud-init
config, custom template generation, and automatic weekly template updates
via the GitHub REST API. Config: `~/.config/dbmenu.yaml`.

**Integration points:**

| Direction | Trigger | Action |
|---|---|---|
| distrobuilder → eggs | `eggs produce` (post) | `distrobuilder-hook.sh` optionally builds LXC/Incus image of produced system |
| distrobuilder → recovery | pre-reset | `distrobuilder-recovery-hook.sh` snapshots rootfs via `distrobuilder pack-incus` or `pack-lxc` |

**Full export pipeline:**

```
eggs produce --distrobuilder [--distrobuilder-type=incus|lxc|both]
  │
  ├── ISO assembly (squashfs produced at snapshot_dir/mnt/iso/live/filesystem.squashfs)
  │
  └── runDistrobuilder() in produce.ts
        │
        └── distrobuilder-hook.sh
              ├── locate filesystem.squashfs (EGGS_ISO_MNT/live/ → EGGS_ISO_ROOT → EGGS_WORK → ISO mount fallback)
              ├── unsquashfs etc/os-release → detect distro / release / arch
              ├── resolve templates/penguins-eggs.yaml
              └── distrobuilder build-incus|build-lxc \
                    -o image.distribution=<distro> \
                    -o image.release=<release> \
                    -o image.architecture=<arch> \
                    templates/penguins-eggs.yaml \
                    /var/lib/eggs/distrobuilder/
```

**Template actions** (`templates/penguins-eggs.yaml`):
- `source.downloader: rootfs-http` with `url: file://<squashfs>` — consumes eggs squashfs directly
- `packages.cleanup` — removes penguins-eggs, calamares, live-boot, casper
- `post-unpack` actions — strips live artefacts, resets hostname, regenerates machine-id, cleans fstab

**Install:**
```bash
sudo make install-full          # snap + eggs plugin + template + config
sudo make install-full-source   # build distrobuilder from source
```

**Configuration** (`/etc/penguins-distrobuilder/eggs-hooks.conf`):

```sh
# eggs-plugin
DISTROBUILDER_ENABLED=1
DISTROBUILDER_TYPE=incus          # incus | lxc | both
DISTROBUILDER_OUTPUT=/var/lib/eggs/distrobuilder
DISTROBUILDER_TEMPLATE=           # leave empty to use bundled template
DISTROBUILDER_EXTRA_OPTS=         # e.g. --debug
DISTROBUILDER_CLEANUP_SQUASHFS=1  # remove temp squashfs copy after build

# recovery-plugin
DISTROBUILDER_RECOVERY_ENABLED=1
DISTROBUILDER_RECOVERY_ROOTFS=/
DISTROBUILDER_RECOVERY_OUTPUT=/var/lib/eggs/distrobuilder/recovery
```

Source: [`penguins-distrobuilder/`](penguins-distrobuilder/) — Go + Python.
Upstream repos: https://github.com/lxc/distrobuilder and https://github.com/itoffshore/distrobuilder-menu

---

### incus-image-server

**Purpose:** Unified simplestreams image server for LXC/LXD/Incus. The serving
layer for images produced by `penguins-distrobuilder`. Enables `eggs produce
--publish-incus` to build and publish a container image in a single command.

**Internal layout:**

```
incus-image-server/unified-image-server/
├── server/            # Elixir/Phoenix simplestreams server (upmaru/polar base)
├── manifests/         # distrobuilder YAMLs for all supported distros
├── chromiumos-stage3/ # parameterized ChromiumOS stage3 builder
└── penguins-eggs/     # ChromiumOS family backend drop-ins for eggs
```

**Full produce → publish pipeline:**

```
eggs produce --publish-incus \
  --publish-incus-url=https://images.example.com \
  --publish-incus-token=<token> \
  --publish-incus-product=<id>
  │
  ├── ISO assembly
  ├── runDistrobuilder() → distrobuilder-hook.sh → incus.tar.xz + rootfs.tar.xz
  └── publishToIncusImageServer()
        ├── POST /publish/products/:id/versions        → create version (serial=YYYYmmddHHMM)
        └── POST /publish/products/:id/versions/:v/upload
              ├── metadata=incus.tar.xz
              └── rootfs=rootfs.tar.xz  (or kvmdisk=disk.qcow2 for VMs)

# Clients pull with:
incus image copy images:<product-id> local:
lxc image copy images:<product-id> local:
```

**Server components:**

| Component | Description |
|---|---|
| Storage backends | S3-compatible (AWS, MinIO, Cloudflare R2, Backblaze B2) or local filesystem |
| Publish workflows | CI/CD (icepak/S3 pre-upload) or direct multipart upload |
| Architecture support | Any lowercase alphanumeric string — no fixed list enforced |
| Multi-tenancy | Per-space credential generation |

**Manifests** (`manifests/`): Debian, Ubuntu, Devuan, Alpine, Arch, Fedora,
AlmaLinux, Rocky Linux, openSUSE, Gentoo (OpenRC + systemd), ChromiumOS
(via stage3 wrapper), Talos Linux (VM only).

**ChromiumOS stage3** (`chromiumos-stage3/`): Parameterized builder derived
from sebanc/chromiumos-stage3. Supports `amd64` (`reven` board) and `arm64`
(generic + openFyde hardware boards: rpi4, rpi5, rock5b, rockpi4b, rock4cp,
orangepi5, firefly-rk3588spc, firefly-itx3588j, arm64-openfyde_vmware).

**penguins-eggs ChromiumOS drop-ins** (`penguins-eggs/`):
- `src/classes/pacman.d/chromiumos.ts` — Portage/Chromebrew backend with
  stage3 awareness, board detection, `capabilities()` diagnostic
- `conf/derivatives_chromiumos.yaml` — adds stage3 + all openFyde board IDs
- `conf/flavours/chromiumos.yaml` — arch-aware tarball filters, `openfyde`
  flavour, stage3 notes for vanadium/cromite

**Configuration** (shared with penguins-distrobuilder,
`/etc/penguins-distrobuilder/eggs-hooks.conf`):

```sh
INCUS_SERVER_URL=https://images.example.com
INCUS_SERVER_TOKEN=<publish-session-token>
INCUS_SERVER_PRODUCT=<product-id>
```

Source: [`incus-image-server/`](incus-image-server/) — Elixir + Shell + TypeScript.
Upstream: https://github.com/Interested-Deving-1896/incus-image-server

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
