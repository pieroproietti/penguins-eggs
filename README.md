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

[![coaoa](./coaoa.jpeg "Visit the Penguins' eggs Telegram channel")](https://t.me/penguins_eggs)


## Star History

This project collects stars, look to the sky... contribute!

[![Star History Chart](https://api.star-history.com/svg?repos=pieroproietti/penguins-eggs&type=Date)](https://star-history.com/#pieroproietti/penguins-eggs&Date)

---
*Created with passion by Piero Proietti.*

### blog
* [https://penguins-eggs.net](https://penguins-eggs.net)

