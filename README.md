# 🥚 penguins-eggs

**A universal Linux remastering and reinstallation system.**

[![country](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpenguins-eggs.net%2Fapi%2Fcensus&query=%24.total_countries&label=country&color=orange)](https://penguins-eggs.net/api/census#country)
[![distro](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpenguins-eggs.net%2Fapi%2Fcensus&query=%24.total_distros&label=distro&color=blueviolet)](https://penguins-eggs.net/api/census#distro)
[![remaster](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpenguins-eggs.net%2Fapi%2Fcensus&query=%24.by_action.remaster&label=remaster&color=007ec6)](https://penguins-eggs.net/api/census#remaster)
[![sysinstall](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpenguins-eggs.net%2Fapi%2Fcensus&query=%24.by_action.sysinstall&label=sysinstall&color=28a745)](https://penguins-eggs.net/api/census#sysinstall)
[![donate](https://img.shields.io/badge/Donate-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/penguinseggs)

---

**penguins-eggs** is a command-line tool that lets you **remaster** your running Linux system into a bootable, hybrid live ISO (UEFI + BIOS) and easily **reinstall** it on other machines or virtual environments.

Whether you want to build a custom Linux distribution, clone your workstation with all configurations and personal data intact, or deploy systems at scale, `eggs` provides a fast, unified, and consistent workflow across multiple Linux families.

---

### Key Features

* **Remastering (`eggs remaster`, `eggs wizard`)**:
  - **Standard Live**: Generates a clean, redistributable live ISO stripped of personal credentials.
  - **Clone Mode (`--clone`)**: Produces a full system backup preserving user accounts, configurations, and home directories.
  - **Encrypted Clone (`--crypted`)**: Creates a secure, LUKS2-encrypted live system.
* **Reinstallation (`eggs sysinstall`)**:
  - **Krill (TUI)**: Fast, native text installer supporting full disk installations, pre-partitioned layouts (handling multi-ESP dual-boot and preserving `/home`), and **Coexist** multi-boot slots.
  - **Calamares (GUI)**: Full integration with the Calamares graphical installer, complete with dynamic branding and custom artwork.
* **Cross-Distribution**: Works across Alpine, Arch, Debian, Devuan, OpenKylin, Ubuntu, Fedora, Manjaro, openSUSE and derivatives.
* **AI & Automation (`eggs mcp`)**: Built-in Model Context Protocol server enabling AI assistants to safely inspect and run remastering flights.

---

## 📜 Philosophy

The **penguins-eggs** project aims to provide a "Passepartout" for Linux remastering. By separating the **Mind** (Go) from the **Workhorse** (C), we achieve a clean, maintainable, and incredibly fast workflow that can adapt to any distribution without changing the user experience.

For the founding vision and origins, see the [Manifestum](./DOCS/1-philosophy/1-manifestum.md) and the [eggs-bananas](https://penguins-eggs.net/blog/eggs-bananas) article. Full documentation can be found in [DOCS](./DOCS/README.md).

---

## 🏗 Architecture: The Brain and The Muscle

penguins-eggs is built with a dual architecture combining the performance of C with the flexibility of Go:

### 🧠 [coa](./DOCS/3-developer-manual/architecture/1-overview.md) - The Brain (Go)
The orchestration layer powering the primary **`eggs`** CLI. It manages configuration blueprints, distribution probing, installer routing, and the MCP agent daemon.

*For command usage, see the [eggs Command Reference](./DOCS/2-user-manual/2-commands.md).*

### 🦾 [oa](./DOCS/3-developer-manual/architecture/3-oa.md) - The Muscle (C)
The low-level workhorse engine with zero third-party dependencies. It interacts directly with the Linux kernel:
* Managing OverlayFS and chroot mounts.
* Driving SquashFS compression engines.
* Handling safe user and group synchronization.
* Delivering maximum speed and zero-copy efficiency.

## 🚀 Getting Started

> The primary CLI command is **`eggs`** (e.g. `eggs remaster`, `eggs wizard`, `eggs sysinstall`, `eggs destroy`, `eggs mcp`). The binary is available as both `eggs` and `coa`. See the [Quick Start](./DOCS/2-user-manual/1-quickstart.md) for the full command usage.

### Prerequisites
- A Linux system (Debian-based, Arch-based, Fedora-based or Manjaro-based).
  - *Note for Fedora users*: It is recommended to set `SELINUX=permissive` in `/etc/selinux/config` (or run `sudo setenforce 0`) to avoid unexplained permission blocks.
- `gcc` and `make` (for `oa`).
- `golang` 1.25+ (for `coa`).

### Build Everything
From this root directory, simply run:
```bash
make
```

This will compile both binaries:
- `./oa/oa` (The Engine)
- `./coa/coa` (The Orchestrator)

> TIP: Actually you can get native packages, simply using `make clean package`

---

## 🧩 The Ecosystem: penguins-gui & penguins-chef

The engine that performs the live remastering remains **penguins-eggs**. Around it, a streamlined ecosystem of companion tools has developed, each with a focused responsibility:

```text
penguins-gui ──┐
               ├──> penguins-eggs ──> Live ISO
CLI ───────────┘

penguins-chef    →  system provisioning, recipes, and customizations
```

* **[penguins-gui](https://github.com/pieroproietti/penguins-gui)** (The Graphical Interface): An independent desktop application written in Go using Fyne, also distributed as an **AppImage** to run everywhere without installation. It acts as a friendly entry point: it automatically detects and installs the appropriate native `penguins-eggs` package for your distribution, triggers remastering flights graphically (Standard Live, System Clone, and Crypted Clone with graphical passphrase entry), displays real-time execution logs, automatically locates and opens the created ISO directory via `xdg-open`, configures repositories, and installs Calamares.
![penguins-gui](https://github.com/pieroproietti/penguins-gui/blob/main/penguins-gui.png?raw=true)

* **[penguins-chef](https://github.com/pieroproietti/penguins-chef)** (The Recipe & Provisioning Engine): A standalone tool for system provisioning and configuration. Chef configures Linux systems by applying explicit, reproducible recipes — installing packages, setting up services, and shaping desktop environments before the system is remastered by `eggs`. Think of Chef as the person who cooks the system:
  ```bash
  chef get
  sudo chef apply .chef/recipes/costumes/colibri/colibri.yaml
  sudo chef apply .chef/recipes/dev/devel.yaml
  ```

## 🌍 Worldwide Live Adoption
Since October 19, 2026: 
[![country](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpenguins-eggs.net%2Fapi%2Fcensus&query=%24.total_countries&label=country&color=orange)](https://penguins-eggs.net/api/census#country)
[![distro](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpenguins-eggs.net%2Fapi%2Fcensus&query=%24.total_distros&label=distro&color=blueviolet)](https://penguins-eggs.net/api/census#distro)
[![remaster](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpenguins-eggs.net%2Fapi%2Fcensus&query=%24.by_action.remaster&label=remaster&color=007ec6)](https://penguins-eggs.net/api/census#remaster)
[![sysinstall](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpenguins-eggs.net%2Fapi%2Fcensus&query=%24.by_action.sysinstall&label=sysinstall&color=28a745)](https://penguins-eggs.net/api/census#sysinstall)

[![Star History Chart](https://api.star-history.com/svg?repos=pieroproietti/penguins-eggs&type=Date)](https://star-history.com/#pieroproietti/penguins-eggs&Date)

---
*Created with passion by Piero Proietti.*
[![coaoa](./coaoa.jpeg "Visit the Penguins' eggs Telegram channel")](https://t.me/penguins_eggs)

### blog
* [https://penguins-eggs.net](https://penguins-eggs.net)

