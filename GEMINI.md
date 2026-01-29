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

## Development
- **Build:** `pnpm run build`
- **Test:** `pnpm test`
- **Local Run:** `./bin/run [COMMAND]`