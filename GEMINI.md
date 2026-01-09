# Gemini Project Context: penguins-eggs

## Project Overview
`penguins-eggs` is a command-line tool for remastering AlmaLinux, AlpineLinux, Arch, Debian, Devuan, Fedora, Manjaro, Openmamba, openSuSE, RockyLinux, Ubuntu and derivative systems.

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

## Project Ecosystem
- **[penguins-wardrobe](https://github.com/pieroproietti/penguins-wardrobe)**: A collection of scripts and assets (costumes) to transform a "naked" (minimal) CLI system into a "dressed" (full GUI) system automatically.
- **[fresh-eggs](https://github.com/pieroproietti/fresh-eggs)**: Bootstrap scripts to install eggs on various distros.
- **[penguins-eggs.net/repos](https://penguins-eggs.net/repos/)**: Official package repositories.

## Development
- **Build:** `pnpm run build`
- **Test:** `pnpm test`
- **Local Run:** `./bin/run [COMMAND]`

## Recent Milestones & Architecture Specifics

### [2026-01-09] RISC-V Native & Recursive Support
**Status:** Full recursivity (Self-hosting) achieved on `riscv64` architecture.

#### Technical Implementation Details
1.  **Bootloader Logic (`eggs` core):**
    * **Detection:** Automatic detection of `riscv64` architecture.
    * **Flag Strategy:** Implemented `--removable` flag for `grub-install` on RISC-V targets.
    * *Why:* This forces the creation of `/EFI/BOOT/BOOTRISCV64.EFI`, bypassing NVRAM volatility issues on QEMU and ensuring bootability on SBCs (Single Board Computers) that rely on the UEFI fallback path.

2.  **Installer Fixes (`krill` / calamares setup):**
    * **Recursive Directories:** Fixed `ENOENT` errors on `/etc/sudoers.d/` for minimal systems by implementing recursive directory creation.

3.  **Virtualization & Testing (QEMU Best Practices):**
    * **Storage Driver:** Use `virtio-scsi` (not `virtio-blk`) when installing the produced ISO.
    * *Why:* Krill/Calamares expects devices as `/dev/sdX`. `virtio-blk` maps them as `/dev/vdX`, causing partitioning or bootloader failures if not explicitly handled.
    * **Binfmt:** On Debian (Trixie+), `binfmt_misc` with flag `F` allows running chroot without copying `qemu-riscv64-static` binary inside.

#### QEMU Command Memo (Booting produced ISO)
```bash
qemu-system-riscv64 ... -device virtio-scsi-device,id=scsi0 -device scsi-hd,drive=hd0,bus=scsi0.0 ...