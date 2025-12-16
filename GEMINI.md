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

## Author
- **Piero Proietti <piero.proietti@gmail.com>**