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

* **RISC-V Support (v26.1.8 - v26.1.11):**
    * **Native Support:** Full recursive remastering capability on riscv64 architecture.
    * **Compatibility:** Verified support for Ubuntu 26.04 (Resolute) and smart kernel detection (compressed vs. uncompressed) to avoid manual GRUB edits.
    * **Bootloader Fix:** Corrections to ensure booting on RISC-V boards and QEMU (via fallback path).

* **Structural Refactoring (v26.1.20 - v26.1.21):**
    * **NEST Directory:** Moving and renaming key directories to free up space and improve logic (`.mnt` -> `mnt`, `.mnt/filesystem.squashfs` -> `liveroot`, etc.).
    * **Code:** Adoption of `path.join` for safer path handling and removal of obsolete variables like `machine_id` and `pmount_fixed`.
    * **UX/UI:** Migration to `@inquirer/prompts` to improve interactivity in terminal menus (arrow key navigation).