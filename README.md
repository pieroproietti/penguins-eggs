# Immutable Linux Framework (ILF)

A distro-agnostic, architecture-agnostic framework for building immutable Linux distributions. Distro builders choose one or more immutability backends at build time; the framework provides a unified HAL (Hardware Abstraction Layer) and CLI surface on top.

---

## Integrated Backends

| Backend | Origin Project | Mechanism | Best For |
|---|---|---|---|
| `abroot` | [Vanilla-OS/ABRoot](https://github.com/Vanilla-OS/ABRoot) | A/B partition swap + OCI images | Appliance/desktop, atomic OCI-based updates |
| `ashos` | [ashos/ashos](https://github.com/ashos/ashos) | BTRFS snapshot tree | Multi-distro, hierarchical snapshot management |
| `frzr` | [ChimeraOS/frzr](https://github.com/ChimeraOS/frzr) | Read-only BTRFS subvolume deploy | Gaming/appliance, image-based deployment |
| `akshara` | [blend-os/akshara](https://github.com/blend-os/akshara) | YAML-declared system rebuild | Declarative, container-native distros |
| `btrfs-dwarfs` | [btrfs-dwarfs-framework](https://github.com/Interested-Deving-1896/btrfs-dwarfs-framework) | BTRFS+DwarFS hybrid blend layer | Storage-constrained, high-compression roots |

> **nearly** (blend-os/nearly) is absorbed into the `mutable` core module as the toggle-immutability primitive.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ilf  (unified CLI)                           │
│   ilf init │ ilf upgrade │ ilf rollback │ ilf status │ ilf pkg  │
└────────────────────────┬────────────────────────────────────────┘
                         │  Backend-Agnostic API
┌────────────────────────▼────────────────────────────────────────┐
│                  Core HAL  (core/)                              │
│  config │ bootloader │ snapshot │ update │ mutable │ distro-db  │
└──┬──────┬──────┬──────┬──────┬──────────────────────────────────┘
   │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼
abroot  ashos  frzr  akshara  btrfs-dwarfs
(Go)   (Py)  (Shell) (Py)    (C+Shell)
```

### Core Modules

| Module | Responsibility |
|---|---|
| `core/hal` | Backend registration, capability detection, dispatch |
| `core/config` | Unified `ilf.toml` parser; per-backend config shims |
| `core/bootloader` | GRUB/systemd-boot abstraction (wraps each backend's boot logic) |
| `core/snapshot` | Common snapshot lifecycle: create, list, deploy, delete, rollback |
| `core/update` | Atomic update orchestration; pre/post hooks |
| `core/mutable` | Immutability toggle (absorbs `nearly`'s chattr/overlayfs logic) |

---

## Supported Distro Matrix

Defined in `distros/`. Each file declares which backends are compatible and any distro-specific shims needed.

| Distro Family | Package Manager | Supported Backends |
|---|---|---|
| Arch / CachyOS / EndeavourOS | pacman | ashos, frzr, akshara, btrfs-dwarfs |
| Debian / Ubuntu / Mint | apt | abroot, ashos, akshara |
| Fedora / RHEL / CentOS | dnf/rpm | ashos, akshara |
| Alpine | apk | ashos, akshara |
| Gentoo | portage | ashos |
| openSUSE | zypper | ashos, akshara |
| Void Linux | xbps | ashos, frzr |
| NixOS | nix | (native immutability; ilf wraps as passthrough) |
| ChimeraOS | pacman | frzr (native), ashos |
| Vanilla OS | apt | abroot (native), ashos |
| blendOS | pacman | akshara (native), ashos |

---

## Quick Start

```bash
# Install ILF
curl -fsSL https://ilf.example.org/install.sh | sh

# Initialize a new distro build with the abroot backend
ilf init --distro ubuntu --backend abroot --arch x86_64

# Or with the ashos backend on Arch
ilf init --distro arch --backend ashos --arch aarch64

# Upgrade the system (backend-transparent)
ilf upgrade

# Roll back to the previous state
ilf rollback

# Toggle mutability for a one-off change
ilf mutable enter
# ... make changes ...
ilf mutable exit
```

---

## Repository Layout

```
immutable-linux-framework/
├── core/
│   ├── hal/            # Backend HAL: registration, capability flags, dispatch
│   ├── config/         # ilf.toml schema + per-backend config adapters
│   ├── bootloader/     # GRUB / systemd-boot abstraction
│   ├── snapshot/       # Snapshot lifecycle primitives
│   ├── update/         # Atomic update orchestration
│   └── mutable/        # Immutability toggle (nearly-derived)
│
├── backends/
│   ├── abroot/         # ABRoot v2 adapter (Go shim + config bridge)
│   ├── ashos/          # AshOS adapter (Python shim + distro profiles)
│   ├── frzr/           # frzr adapter (Shell shim + image deploy)
│   ├── akshara/        # akshara adapter (Python shim + system.yaml bridge)
│   └── btrfs-dwarfs/   # BTRFS+DwarFS adapter (C kernel module + daemon shim)
│
├── distros/            # Per-distro capability declarations (TOML)
│
├── docs/
│   ├── architecture.md
│   ├── backends.md
│   ├── distro-matrix.md
│   ├── adding-a-backend.md
│   └── adding-a-distro.md
│
├── tests/
│   ├── integration/
│   └── unit/
│
├── tools/              # ilf CLI source
├── scripts/            # Bootstrap and install helpers
├── systemd/            # ilf-update.service / ilf-update.timer
│
├── ilf.toml.sample     # Reference configuration
└── Makefile
```

---

## Backend Selection at Build Time

In `ilf.toml`:

```toml
[ilf]
distro   = "arch"
arch     = "x86_64"
backend  = "ashos"          # one of: abroot | ashos | frzr | akshara | btrfs-dwarfs

[backend.ashos]
snapshot_root = "/@"
deploy_on_boot = true

[backend.abroot]
registry = "ghcr.io"
image    = "myorg/myos"
tag      = "stable"
```

The `ilf` CLI reads this file and dispatches all operations to the selected backend through the HAL.

---

## Adding a New Backend

See [docs/adding-a-backend.md](docs/adding-a-backend.md). The minimum contract is implementing the HAL interface:

```
init()       → set up partitions / subvolumes
upgrade()    → perform an atomic update
rollback()   → revert to previous state
snapshot()   → create a named snapshot
status()     → report current state
mutable()    → toggle read-write mode
```

---

## License

Each integrated backend retains its original license. ILF framework code (core/, tools/, scripts/) is licensed under **GPL-3.0**.

| Component | License |
|---|---|
| ABRoot | GPL-3.0 |
| AshOS | AGPL-3.0 |
| frzr | MIT |
| akshara | GPL-3.0 |
| nearly | GPL-3.0 |
| btrfs-dwarfs-framework | (see upstream) |
| ILF core/tools | GPL-3.0 |
