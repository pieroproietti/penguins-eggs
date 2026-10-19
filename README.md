See AI context: https://penguins-eggs.net/llms.txt

### 🥚 penguins-eggs
After years of passionate work on the TypeScript **penguins-eggs**, its next evolution is here: the C/Go rewrite now carries the `penguins-eggs` name. The old TypeScript version lives on as [penguins-eggs-legacy](https://github.com/pieroproietti/penguins-eggs-legacy).
penguins-eggs is built on **oa**, a high-performance C-native remastering engine, and **coa**, its intelligent Go orchestrator. This new architecture replaces fragile bash scripts with native Linux kernel syscalls and strict zero-copy principles — delivering a significant leap in speed and reliability.
The goal is ambitious: a truly universal approach to Linux remastering. Every distribution is different, yet they all share common roots. penguins-eggs already supports Alpine, Arch, Debian, Fedora, Manjaro and openSUSE — and aims to prove that a single, unified engine can handle them all.

[![donate](https://img.shields.io/badge/Donate-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/penguinseggs)
---

## 🏗 penguins-eggs

We have transitioned to a monorepo structure to ensure perfect synchronization between the workhorse (oa) and the orchestrator (coa).

### 🧠 [coa](./DOCS/3-developer-manual/architecture/1-overview.md) (**brooding in my dialect**) - The Mind
It manages the full lifecycle: from laying the ISO to the final installation and AI agent orchestration (via MCP). It powers the primary **`eggs`** CLI command.

The name derives from the dialect word coa, referring to the act of brooding or incubating eggs until they are ready to hatch. During early development, the repo was named `oa-tools` with binaries `coa` and `oa`, but `eggs` is the primary CLI executable used by developers and users.

**Language: Go**

For `eggs` commands, see [eggs Command Reference](./DOCS/2-user-manual/2-commands.md).

### 🦾 [oa](./DOCS/3-developer-manual/architecture/3-oa.md) (**eggs in my dialect**) - The Workhorse
**Language: C**
`oa` is the low-level engine. It handles the "heavy lifting" of the system:
- Managing OverlayFS and mount points.
- Executing SquashFS compression.
- Remove and create users and groups via yocto_style functions.
- Interacting directly with the Linux Kernel and system binaries.
- **Philosophy:** Performance, stability, and zero-dependency execution.

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

## 📜 Philosophy
The **penguins-eggs** project aims to provide a "Passepartout" for Linux remastering. By separating the **Mind** (Go) from the **Workhorse** (C), we achieve a clean, maintainable, and incredibly fast workflow that can adapt to any distribution without changing the user experience.

Documentation can be found on [DOCS](./DOCS/README.md). See also the [Manifestum](./DOCS/1-philosophy/1-manifestum.md) for the founding vision and origins.

The article [eggs-bananas](https://penguins-eggs.net/blog/eggs-bananas) philosophy can be read on my blog.

## 🖥️ Ecosystem: GUI, Tailoring & Wardrobe Ateliers


`penguins-eggs` works hand-in-hand with dedicated companion tools and configuration repositories:
* **[penguins-gui](https://github.com/pieroproietti/penguins-gui)**: The independent desktop graphical user interface (GUI) written in Go with !Fyne. Allows desktop users to configure and trigger remastering flights (standard live, system clone, and encrypted clone with graphical passphrase entry), view real-time build logs, locate and open created ISOs with `xdg-open`, configure official repositories, install the `eggs` CLI, install Calamares with Qt5/Qt6 runtimes, and execute maintenance tasks.
![penguins-gui](https://github.com/pieroproietti/penguins-gui/blob/main/penguins-gui.png)

* **[penguins-tailor](https://github.com/pieroproietti/penguins-tailor)**: The CLI tool providing the `tailor` command to configure, dress, and customize your Linux system with desktop profiles ("costumes") and "accessories" before remastering.
* **Wardrobe Ateliers** (Costumes & Accessories):
  * **Main Atelier**: [pieroproietti/penguins-wardrobe](https://github.com/pieroproietti/penguins-wardrobe) (maintained by Piero Proietti)
  * **Quirinux Atelier**: [charliemartinez/penguins-wardrobe](https://github.com/charliemartinez/penguins-wardrobe) (maintained by Charlie Martinez for Quirinux)

## 🌍 Worldwide Census: Live Pulse

To give real-time visibility into how **penguins-eggs** is used around the world and what distributions, architectures, and desktop environments are actively crafted and deployed, penguins-eggs features a transparent, privacy-respecting **Census** telemetry. Every live remastering flight (`eggs remaster`) and system installation (`eggs sysinstall` via Krill or Calamares) can anonymously contribute high-level metrics.

[![Census Events](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpenguins-eggs.net%2Fapi%2Fcensus&query=%24.total_events&label=Remaster%20%26%20Install%20Events&color=007ec6)](https://penguins-eggs.net/api/census)
[![Unique Systems](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpenguins-eggs.net%2Fapi%2Fcensus&query=%24.unique_machines&label=Unique%20Machines&color=28a745)](https://penguins-eggs.net/api/census)
[![Live Census API](https://img.shields.io/badge/Census-Live%20JSON%20API-orange)](https://penguins-eggs.net/api/census)

The live, aggregated global snapshot is publicly available at:
👉 **[https://penguins-eggs.net/api/census](https://penguins-eggs.net/api/census)**

### What does the Census show?
* **Actions in the Wild**: Remaster flights (`remaster`), installations (`sysinstall`), and clone deployments (`--clone`).
* **Distributions & Families**: Live data across Alpine, Arch, Debian, Devuan, Fedora, Kali, Linux Mint, Manjaro, openKylin, Ubuntu, and derivative distros.
* **Environments & Hardware**: Architectures (`amd64`, `arm64`), Desktop Environments (CLI, XFCE, Openbox, Cinnamon, GNOME, KDE, etc.), init systems (`systemd`, `runit`, `openrc`), and virtualization platforms (bare metal, KVM, QEMU, VMware).
* **Global Footprint**: Countries and continents where custom live systems are actively created.

### 🛡️ Privacy & Transparency by Design
The Census is engineered with strict privacy principles:
* **Strictly Anonymous**: Uses a one-way, salted SHA-256 hash UUID derived from `/etc/machine-id`. No IP addresses, user credentials, personal data, or hostnames are ever collected or stored.
* **Inspect What You Share**: The exact JSON payload is saved locally for inspection at `~/.config/penguins-eggs/census.json` (and `/etc/penguins-eggs/census.json`).
* **Encrypted Protection**: Encrypted remaster flights (`--crypted`) automatically disable census telemetry completely.
* **Effortless Opt-Out**: You can disable census reporting at any time:
  - Via CLI flag: `eggs remaster --anonymous` or `eggs sysinstall --anonymous`
  - Via environment variable: `export EGGS_ANONYMOUS=1`
  - In configuration: set `anonymous: true` in `/etc/penguins-eggs.d/custom.yaml`

## Star History

This project collects stars, look to the sky... contribute!
[![Star History Chart](https://api.star-history.com/svg?repos=pieroproietti/penguins-eggs&type=Date)](https://star-history.com/#pieroproietti/penguins-eggs&Date)

---
*Created with passion by Piero Proietti.*
[![coaoa](./coaoa.jpeg "Visit the Penguins' eggs Telegram channel")](https://t.me/penguins_eggs)

### blog
* [https://penguins-eggs.net](https://penguins-eggs.net)

