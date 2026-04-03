# Gemini Project Context: penguins-eggs

## Project Overview
`penguins-eggs` is a command-line tool for remastering AlmaLinux, AlpineLinux, Arch, Debian, Devuan, Fedora, Manjaro, Openmamba, openSuSE, RockyLinux, Ubuntu, and derivative systems.

**The "Magic":** Unlike simple backup tools (like Clonezilla), `eggs` creates a live, bootable ISO image that is **hardware independent**. It removes specific user data and system identifiers (UUIDs, SSH keys), allowing the generated ISO to be installed on different hardware as a fresh distribution.

## Tech Stack
- **Language:** TypeScript
- **Framework:** [oclif](https://oclif.io/)
- **Package Manager:** pnpm
- **Testing:** Mocha & Chai
- **Key Libraries:** `execa` (for shell commands), `chalk` (for TUI colors), `inquirer` (for prompts).
- **Compression:** SquashFS (supports zstd, xz, gzip).

## Upgrade Tracking

### typescript-go (TS 7 native compiler)
`microsoft/typescript-go` is a Go port of the TypeScript compiler targeting a ~10× build speed improvement.
It is available as `@typescript/native-preview` on npm (preview channel).
Currently pinned to `typescript: ^5.9.3`. When `typescript-go` reaches stable/GA:
1. Replace `typescript` devDependency with `@typescript/native-preview` (or the stable package name once announced).
2. Verify `tsconfig.json` compatibility — `module: Node16` and `moduleResolution: node16` are supported.
3. Remove `ts-node` if it becomes redundant (tsgo includes a native runner).
Track progress at: https://github.com/microsoft/typescript-go

## Installers
- **krill:** A TUI system installer developed within eggs. Lightweight, fast, always available.
- **calamares:** Integration with the popular GUI installer. Eggs creates the configuration files needed for Calamares to install the custom ISO.

## Command Palette (The Family Metaphor)
The CLI organizes commands using a family metaphor:
- **`eggs produce`**: The core process. Remasters the system and creates the ISO.
- **`eggs dad`**: Configuration manager. Helps set compression levels, paths, and reset defaults.
- **`eggs kill`**: Cleanup utility. Removes temporary data (`/home/eggs`) and old ISOs to free space.
- **`eggs cuckoo`**: PXE Boot utility. Configures a local PXE server to boot the ISO over the network.
- **`eggs wardrobe`**: Interface to fetch and apply configurations ("costumes") from `penguins-wardrobe`.

## User Key Commands
- **`eggs love`**: The "magic button". Automatically runs: `eggs dad -d` (reset), `eggs tools clean` (cleanup), and `eggs produce` (create ISO).
- **`eggs produce --fast`**: Creates an ISO using lighter compression (faster build, larger file).
- **`eggs produce --max`**: Creates an ISO using maximum compression (slower build, smallest file).
- **`eggs produce --clone`**: Creates a backup of the current system *including* user data in clear text.
- **`eggs produce --homecrypt`**: Creates a backup of the current system *including* user data (encrypted via LUKS).
- **`eggs produce --fullcrypt`**: Creates a backup where *the entire system* is encrypted via LUKS.

---

## Project Timeline & Evolution
In short, the story of **eggs** is a journey from a Debian remastering tool to a universal ISO creation system capable of handling almost any Linux distribution, adapting to various architectures, and offering powerful backup and customization tools.

### 🐣 The Primordial Era (v7.x) - Consolidation and Basic Tools
In this phase, the focus was primarily on the Debian/Ubuntu/Devuan family.
* **Installers:** Intensive work to make `krill` (the CLI installer) reliable, along with standard integration with Calamares for graphical installation.
* **Yolk:** Introduction of the concept of *yolk*, a small local repository that allowed for installation even without an internet connection.
* **Compatibility:** Transition and support across different Node versions (8, 14, 16).
* **Themes:** Initial experiments with custom themes for the ISOs.

### 🛠️ The Era of Technical Expansion (v8.x) - Architectures and Backup
The project began to expand beyond simple x86 remastering.
* **ARM Support:** Introduction of support for arm64 and armel, paving the way for Raspberry Pi and other devices.
* **Backup & Encryption:** Implementation of the `--backup` feature, allowing user data and server configurations to be saved in an encrypted LUKS volume within the ISO, which could then be restored via `krill`.
* **UEFI:** Significant improvements for UEFI boot support, including Secure Boot management in later stages.
* **Refactoring:** Rewriting of core classes like `pacman` and dependency management.

### 👗 The Wardrobe Era (v9.x) - Customization and New Families
A phase of great creativity and openness to new distributions.
* **Wardrobe & Costumes:** Introduction of *Wardrobe*, a system to "dress" a "naked" system with specific configurations, graphical environments, and packages ("costumes").
* **Beyond Debian:** The beginning of concrete support for other distribution families like Arch Linux and Manjaro.
* **Pods:** First experiments with *eggs pods* to create minimal live images starting from containers (Docker/Podman).

### 🦅 The Modern Era (v10.x) - The Universal Egg
The project reaches its current maturity, aiming for universality.
* **Total Multi-Distro:** Extended support to RPM-based distributions (Fedora, AlmaLinux, RockyLinux, OpenSUSE) and even Alpine Linux (a notable technical challenge given its distinct nature).
* **Enterprise Features:** Support for LVM2 encrypted installations and improvements for server environments.
* **Modern Tooling:** Adoption of modern tools, AI-assisted refactoring, and new interfaces like `eggsmaker` (GUI).

### 🔐 Encryption and Infrastructure (v25.x)
Focus shifts to security, distribution methods, and infrastructure consolidation.
* **Encryption Features:** Introduction of advanced options like `--homecrypt` (encrypted user home via LUKS) and `--fullcrypt` (full root filesystem encryption). These features underwent several iterations to resolve sizing (`resize2fs`), boot (`mkinitramfs`), and autologin issues.
* **Unified Repositories:** Consolidation of packages into new centralized repositories (`penguins-eggs-repo`), deprecating chaotic PPA/AUR sources.
* **AppImage:** Introduction of an AppImage version to offer a single portable executable across distros, supported by native meta-packages for dependencies.
* **Secure Boot:** Enhancements for Secure Boot support on Debian/Ubuntu systems.

### 🚀 Recent Developments (v26.x) - RISC-V and Refactoring
The current phase involves supporting new hardware frontiers and deep structural cleaning.
* **RISC-V Support (v26.1.8 - v26.1.11):** Native recursive remastering on riscv64, compatibility with Ubuntu 26.04, and bootloader fixes for QEMU/SBCs.
* **Structural Refactoring (v26.1.20 - v26.1.21):**
    * **NEST Directory:** Moving and renaming key directories to free up space and improve logic (`.mnt` -> `mnt`, `.mnt/filesystem.squashfs` -> `liveroot`, etc.).
    * **Code:** Adoption of `path.join` for safer path handling and removal of obsolete variables.
    * **UX/UI:** Migration to `@inquirer/prompts` to improve interactivity in terminal menus.

---

## Architecture Deep Dive: RISC-V Implementation
**Status:** Full recursivity (Self-hosting) achieved on `riscv64` architecture.

### Technical Implementation Details
1. **Bootloader Logic (`eggs` core):**
    * **Detection:** Automatic detection of `riscv64` architecture.
    * **Flag Strategy:** Implemented `--removable` flag for `grub-install` on RISC-V targets.
    * *Why:* This forces the creation of `/EFI/BOOT/BOOTRISCV64.EFI`, bypassing NVRAM volatility issues on QEMU and ensuring bootability on SBCs (Single Board Computers) that rely on the UEFI fallback path.

2. **Installer Fixes (`krill` / calamares setup):**
    * **Recursive Directories:** Fixed `ENOENT` errors on `/etc/sudoers.d/` for minimal systems by implementing recursive directory creation.

3. **Virtualization & Testing (QEMU Best Practices):**
    * **Storage Driver:** Use `virtio-scsi` (not `virtio-blk`) when installing the produced ISO.
    * *Why:* Krill/Calamares expects devices as `/dev/sdX`. `virtio-blk` maps them as `/dev/vdX`, causing partitioning or bootloader failures if not explicitly handled.
    * **Binfmt:** On Debian (Trixie+), `binfmt_misc` with flag `F` allows running chroot without copying `qemu-riscv64-static` binary inside.

### QEMU Command Memo (Booting produced ISO)
```bash
qemu-system-riscv64 ... -device virtio-scsi-device,id=scsi0 -device scsi-hd,drive=hd0,bus=scsi0.0 ...
```

## Project Ecosystem
- **[penguins-wardrobe](https://github.com/pieroproietti/penguins-wardrobe)**: A collection of scripts and assets (costumes) to transform a "naked" (minimal) CLI system into a "dressed" (full GUI) system automatically.
- **[fresh-eggs](https://github.com/pieroproietti/fresh-eggs)**: Bootstrap scripts to install eggs on various distros.
- **[penguins-eggs.net/repos](https://penguins-eggs.net/repos/)**: Official package repositories.

## Penguins Ecosystem (all-features branch)

The `all-features` branch integrates four companion tools under `integrations/`.
Each registers hooks that `eggs produce` calls via the plugin loader.

### penguins-recovery (`integrations/penguins-recovery/`)
Unified rescue toolkit. Layers recovery tools onto any penguins-eggs naked ISO
via distro-family adapters (apt, pacman, dnf, zypper, apk, emerge). Includes
standalone builders (Debian, Arch, UKI, Alpine lifeboat, Rescatux), a KDE
Plasma Nano GUI (minimal/touch/full profiles), and the Rescapp wizard.
- CLI: `penguins-recovery snapshot create <label>`
- eggs hook: `integration/eggs-plugin/recovery-hook.sh`

### penguins-powerwash (`integrations/penguins-powerwash/`)
Factory reset tool with five modes: soft (dotfiles only), medium (+ packages),
hard (+ home wipe), sysprep (machine-ID clear), hardware (full firmware reset).
Calls `eggs produce --naked` before a hard reset and embeds the powerwash
binary + a GRUB "Factory Reset" entry into produced ISOs.
- Config: `/etc/penguins-powerwash/eggs-hooks.conf`
- eggs hook: `integration/eggs-plugin/powerwash-hook.sh`

### penguins-immutable-framework / PIF (`integrations/penguins-immutable-framework/`)
Go + Shell framework for building immutable Linux distributions. Provides a
unified CLI over five backends: abroot (A/B OCI), ashos (BTRFS snapshots),
frzr (read-only BTRFS), akshara (declarative YAML), btrfs-dwarfs (compressed
hybrid). Hooks into eggs so `pif upgrade` and `pif mutable exit` trigger ISO
snapshots at the right moments.
- Config: `pif.toml` `[hooks]` section
- eggs hook: `integration/eggs-plugin/pif-hook.sh`

### penguins-kernel-manager / PKM (`integrations/penguins-kernel-manager/`)
Python tool covering the full kernel lifecycle: fetch → patch → configure →
compile → package → install → hold → remove. Supports Ubuntu Mainline PPA,
XanMod, Liquorix, distro-native, Gentoo source, local packages, and lkf build
profiles across all architectures and package managers. Notifies eggs after
kernel changes so the next ISO reflects the active kernel.
- Config: `/etc/penguins-kernel-manager/hooks.conf`
- eggs hook: `integration/eggs-plugin/pkm-hook.sh`

### eggs-gui (`integrations/eggs-gui/` and `eggs-gui/`)
Unified GUI for penguins-eggs. A Go daemon exposes all eggs operations over
JSON-RPC on a Unix socket; three frontends connect to it: BubbleTea TUI (Go),
NodeGUI desktop (Qt6/TypeScript), NiceGUI web (Python). Features: ISO produce
with full option control, AUTO mode, Dad/Tools config editors, wardrobe browser,
Calamares management, i18n (es, en, pt, it).
- New `eggs gui` command: starts daemon + launches chosen frontend
- Install: `sudo ./integrations/eggs-gui/scripts/install-eggs-gui.sh [--desktop] [--web] [--all]`
- systemd: `eggs-daemon.service` (installed by install script)
- CLI: `eggs gui [--frontend=tui|desktop|web] [--daemon-only] [--stop]`

### eggs-ai (`integrations/eggs-ai/` and `eggs-ai/`)
AI assistant for penguins-eggs. 7 built-in LLM providers (Gemini, OpenAI,
Anthropic, Mistral, Groq, Ollama, custom). Exposes a CLI, HTTP API
(`http://127.0.0.1:3737/api/*`), MCP server (10 tools), TypeScript SDK, and
client code for all three eggs-gui frontends.
- New `eggs ai` command: delegates all subcommands to eggs-ai binary
- Install: `eggs ai install` (uses upstream install.sh; installs eggs-ai.service)
- CLI: `eggs ai doctor|ask|chat|build|config|calamares|serve|mcp|providers`
- Config: `~/.eggs-ai.yaml` (`eggs ai providers init` to generate)

### penguins-eggs-audit (`integrations/penguins-eggs-audit/`)
Security audit and supply chain transparency framework. Extends the 6 original
plugin domains with Security & Audit (vouch attestation, OS hardening,
vulnerability scanning) and SBOM & Supply Chain (syft, grant, SBOM-Generation).
39 upstream projects, 8 domains, TypeScript + Shell.
- Wired into `eggs produce --audit` (SBOM via syft, license scan via grant,
  attestation via vouch, OS hardening via OsHardening class)
- Flags: `--audit-format`, `--audit-output`, `--audit-vouch-key`,
  `--audit-hardening`, `--audit-grant-policy`, `--audit-fail-on-deny`

### penguins-distrobuilder (`integrations/penguins-distrobuilder/`)
Unified project combining lxc/distrobuilder (Go) and distrobuilder-menu
(Python TUI). Enables `eggs produce --distrobuilder` to export any produced
system to an Incus or LXC container image.

Export pipeline: after ISO assembly, `runDistrobuilder()` in `produce.ts`
invokes `distrobuilder-hook.sh`, which locates the eggs squashfs, reads
`os-release` from inside it via `unsquashfs`, then calls
`distrobuilder build-incus|build-lxc` with `templates/penguins-eggs.yaml`.
The template uses `source.downloader: rootfs-http` with `url: file://<squashfs>`
to consume the squashfs directly, strips live-boot artefacts in post-unpack
actions, and resets hostname + machine-id.

CLI flags added to `eggs produce`:
- `--distrobuilder` — enable export
- `--distrobuilder-type=incus|lxc|both` — image type (default: incus)
- `--distrobuilder-output=<dir>` — output directory

Install: `sudo make install-full` (in `integrations/penguins-distrobuilder/`)
Config: `/etc/penguins-distrobuilder/eggs-hooks.conf`
Always-on: set `DISTROBUILDER_ENABLED=1` in config
Upstream: https://github.com/lxc/distrobuilder + https://github.com/itoffshore/distrobuilder-menu

### incus-image-server (`integrations/incus-image-server/`)
Simplestreams image server for LXC/LXD/Incus. Serving layer for images
produced by penguins-distrobuilder. Enables `eggs produce --publish-incus`
to build and publish in one command.

Components:
- `server/` — Elixir/Phoenix simplestreams server; S3-compatible + local
  filesystem storage; direct multipart upload endpoint; no arch constraints
- `manifests/` — distrobuilder YAMLs for all supported distros
- `chromiumos-stage3/` — ChromiumOS stage3 builder (amd64 reven + arm64 openFyde)
- `penguins-eggs/` — ChromiumOS family drop-ins: chromiumos.ts (Portage/
  Chromebrew, stage3/board detection), derivatives_chromiumos.yaml,
  flavours/chromiumos.yaml (arch-aware, openfyde flavour)

Publish pipeline: `publishToIncusImageServer()` in `produce.ts` creates a
version via `POST /publish/products/:id/versions`, then uploads
`incus.tar.xz` + `rootfs.tar.xz` (or `disk.qcow2`) via multipart POST.
Config: `INCUS_SERVER_URL`, `INCUS_SERVER_TOKEN`, `INCUS_SERVER_PRODUCT`
in `/etc/penguins-distrobuilder/eggs-hooks.conf`.

### Plugin dispatch order (eggs produce)
```
eggs produce
  └── plugin loader (src/)
        ├── penguins-recovery      → snapshot before produce
        ├── penguins-powerwash     → embed binary + GRUB entry
        ├── PIF                    → embed backend state
        ├── PKM                    → embed kernel list
        ├── penguins-eggs-audit    → SBOM + attestation + license scan
        ├── penguins-distrobuilder → optional LXC/Incus image build
        └── incus-image-server     → optional publish via --publish-incus
```

See `integrations/ARCHITECTURE.md` for the full integration map.

## Development
- **Build:** `pnpm run build`
- **Test:** `pnpm test`
- **Local Run:** `./bin/run [COMMAND]`