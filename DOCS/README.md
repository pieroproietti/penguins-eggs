# penguins-eggs Documentation

Welcome to the official **penguins-eggs** (C/Go engine) documentation.

---

## 📜 1. Philosophy & Vision (`1-philosophy/`)
- [Manifestum](./1-philosophy/1-manifestum.md) — The founding manifesto: origins, vision, and call to action.
- [Philosophy](./1-philosophy/2-philosophy.md) — The three-actor model and the evolution from Bash to C+Go.
- [The Principle of Transparency](./1-philosophy/3-transparency-principle.md) — Evidence-based detection, system DNA preservation, and native tooling.
- [The Universal Strategy](./1-philosophy/4-universal-strategy.md) — The philosophical and technical framework behind multi-distro support.
- [Roadmap](./1-philosophy/5-roadmap.md) — Current state of development and open tasks.

---

## 📘 2. User Manual (`2-user-manual/`)
- [Quick Start](./2-user-manual/1-quickstart.md) — Quick start guide: generate your first live ISO in three commands and compatibility matrix.
- [Command Reference](./2-user-manual/2-commands.md) — Complete reference for all `eggs` commands, flags, and usage examples.
- [Chromebook Support](./2-user-manual/3-chromebook.md) — Chromebook hardware preparation (eMMC, ChromeOS EC) via initramfs modules.
- [Proxmox VE on Phone](./2-user-manual/4-proxmox-ve-on-phone.md) — Guide to installing and running Proxmox VE on smartphones / ARM hardware.

---

## 🛠 3. Developer Manual & Architecture (`3-developer-manual/`)

### 🧠 System Architecture (`3-developer-manual/architecture/`)
- [Overview](./3-developer-manual/architecture/1-overview.md) — How `coa` (Go) and `oa` (C) orchestrate the remastering pipeline ("The Mind & The Muscle").
- [Building](./3-developer-manual/architecture/2-building.md) — Requirements and build toolchain for native packages.
- [The C Arm: `oa`](./3-developer-manual/architecture/3-oa.md) — The low-level engine: plan execution, native modules, dispatcher.
- [The Go Craftsman: `coa ell`](./3-developer-manual/architecture/4-ell.md) — Worker modules delegated by the C engine.
- [The Navigator: `parser`](./3-developer-manual/architecture/5-parser.md) — Detection, YAML template rendering, profile creation.
- [Installer Architecture](./3-developer-manual/architecture/6-installer.md) — `sysinstall`: one engine, two interfaces (Calamares GUI + Krill TUI).
- [The Engineer: `planner`](./3-developer-manual/architecture/7-planner.md) — Execution plan compilation, exclude lists, breakpoints.
- [Model Context Protocol (MCP)](./3-developer-manual/architecture/8-mcp.md) — Native MCP server and AI agent integration framework.

### ⚙️ Development Workflow & CI (`3-developer-manual/workflow/`)
- [CI Architecture](./3-developer-manual/workflow/ci.md) — The three CI phases: Hammers (packaging), Furnace (remastering), and Incubator (installation).
- [Proxmox Integration](./3-developer-manual/workflow/proxmox.md) — VirtFS configuration, Guest Agent, serial console, and export.

---

## 👔 4. Companion Ecosystem: Tailoring & Wardrobe Ateliers
- **[penguins-tailor](https://github.com/pieroproietti/penguins-tailor)** — Standalone system tailoring tool providing the `tailor` CLI command to configure and dress systems with desktop profiles and accessories before remastering.
- **Wardrobe Ateliers** — Configuration repositories containing costumes and accessories:
  - Main Atelier: [pieroproietti/penguins-wardrobe](https://github.com/pieroproietti/penguins-wardrobe) (by Piero Proietti)
  - Quirinux Atelier: [charliemartinez/penguins-wardrobe](https://github.com/charliemartinez/penguins-wardrobe) (by Charlie Martinez)

