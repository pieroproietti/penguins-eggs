# penguins-eggs Documentation

Benvenuti nella documentazione ufficiale di **penguins-eggs** (C/Go engine).

---

## 📜 1. Filosofia & Visione (`1-philosophy/`)
- [Manifestum](./1-philosophy/manifestum.md) — Il manifesto fondativo: origini, visione e chiamata all'azione.
- [Philosophy](./1-philosophy/philosophy.md) — Il modello a tre attori e l'evoluzione da Bash a C+Go.
- [The Universal Strategy](./1-philosophy/universal-strategy.md) — Il quadro filosofico e tecnico dietro il supporto multi-distro.
- [The Principle of Transparency](./1-philosophy/transparency-principle.md) — Rilevamento basato sulle evidenze, preservazione del DNA di sistema e strumenti nativi.
- [Roadmap](./1-philosophy/roadmap.md) — Stato attuale dello sviluppo e punti aperti.

---

## 📘 2. Manuale Utente (`2-user-manual/`)
- [Quick Start](./2-user-manual/quickstart.md) — Guida rapida: genera la prima ISO live in tre comandi e tabella di compatibilità.
- [Command Reference](./2-user-manual/commands.md) — Referenza completa di tutti i comandi `eggs`, flag ed esempi d'uso.
- [Chromebook Support](./2-user-manual/chromebook.md) — Preparazione hardware Chromebook (eMMC, ChromeOS EC) tramite moduli initramfs.
- [Proxmox VE on Phone](./2-user-manual/proxmox-ve-on-phone.md) — Guida all'installazione ed esecuzione di Proxmox VE su smartphone / hardware ARM.

---

## 🛠 3. Manuale di Sviluppo & Architettura (`3-developer-manual/`)

### 🧠 Architettura del Sistema (`3-developer-manual/architecture/`)
- [Overview](./3-developer-manual/architecture/overview.md) — Come `coa` (Go) e `oa` (C) orchestravano la pipeline di remastering ("The Mind & The Muscle").
- [The C Arm: `oa`](./3-developer-manual/architecture/oa.md) — Il motore di basso livello: esecuzione del piano, moduli nativi, dispatcher.
- [The Go Craftsman: `coa ell`](./3-developer-manual/architecture/ell.md) — I moduli worker delegati dal motore C.
- [The Navigator: `parser`](./3-developer-manual/architecture/parser.md) — Rilevamento, rendering dei template YAML, creazione dei profili.
- [The Engineer: `planner`](./3-developer-manual/architecture/planner.md) — Compilazione del piano di esecuzione, exclude list, breakpoints.
- [Installer Architecture](./3-developer-manual/architecture/installer.md) — `sysinstall`: un solo motore, due interfacce (Calamares GUI + Krill TUI).

### ⚙️ Workflow di Sviluppo & CI (`3-developer-manual/workflow/`)
- [Building](./3-developer-manual/workflow/building.md) — Requisiti e toolchain di compilazione dei pacchetti nativi.
- [CI Architecture](./3-developer-manual/workflow/ci.md) — Le tre fasi della CI: Hammers (packaging), Furnace (remastering) e Incubator (installazione).
- [Proxmox Integration](./3-developer-manual/workflow/proxmox.md) — Configurazione VirtFS, Guest Agent, console seriale ed export.
