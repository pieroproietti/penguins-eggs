> [!IMPORTANT]
> # STOP ALL WARS
>
> ## Non gridate più
>
> Cessate d'uccidere i morti,  
> Non gridate più, non gridate  
> Se li volete ancora udire,  
> Se sperate di non perire.  
> 
> Hanno l'impercettibile sussurro,  
> Non fanno più rumore  
> Del crescere dell'erba,  
> Lieta dove non passa l'uomo.
>
> — *Giuseppe Ungaretti*
>
> ---
>
> Millennial civilizations and sovereign nations are being razed to the ground by the same logic of dominance that has stained human history for centuries. From the Middle East to Ukraine, we are witnessing the destruction of our common heritage. No modern ideology or national interest can justify these crimes. 
> 
> **Silence is complicity, stop the massacre.**
---

> ## ⚡ REBRANDING NOTICE
>
> **`oa-tools` is becoming the new `penguins-eggs`**
>
> | Current | Future |
> | :--- | :--- |
> | `penguins-eggs` (TypeScript) | → `penguins-eggs-legacy` (maintained) |
> | `oa-tools` (C/Go) | → `penguins-eggs` (successor) |
>
> **New users → use `oa-tools`** (faster, C/Go).  
> **Existing users → legacy `penguins-eggs`** remains supported.
>
> *Rebranding happens when `--clone` is fully implemented in `oa-tools`.*
>
> — Piero Proietti

### 🥚 oa-tools - A Next-Generation Remastering Suite
After years of passionate work on **penguins-eggs**, I am now undertaking its next evolution: [oa-tools](https://github.com/pieroproietti/oa-tools).
oa-tools is built on **oa**, a high-performance C-native remastering engine, and **coa**, its intelligent Go orchestrator. This new architecture replaces fragile bash scripts with native Linux kernel syscalls and strict zero-copy principles — delivering a significant leap in speed and reliability.
The goal is ambitious: a truly universal approach to Linux remastering. Every distribution is different, yet they all share common roots. oa-tools already supports Alpine, Arch, Debian, Fedora, Manjaro and openSUSE — and aims to prove that a single, unified engine can handle them all.

[![donate](https://img.shields.io/badge/Donate-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/penguinseggs)


## 🏗 oa-tools Architecture

We have transitioned to a monorepo structure to ensure perfect synchronization between the workhorse (oa) and the orchestrator (coa).

### 🧠 [coa](./DOCS/architecture/overview.md) (**brooding in my dialect**) - The Mind
It manages the full lifecycle: from laying the ISO to the final installation.

The name derives from the dialect word coa, referring to the act of brooding or incubating eggs until they are ready to hatch.

**Language: Go**

For coa commands, see [coa command Reference](./DOCS/manual/commands.md).

### 🦾 [oa](./DOCS/architecture/oa.md) (**eggs in my dialect**) - The Workhorse
**Language: C**
`oa` is the low-level engine. It handles the "heavy lifting" of the system:
- Managing OverlayFS and mount points.
- Executing SquashFS compression.
- Remove and create users and groupt via yocto_style functions.
- Interacting directly with the Linux Kernel and system binaries.
- **Philosophy:** Performance, stability, and zero-dependency execution.

## 🚀 Getting Started

> **Coming from penguins-eggs?** The binary is installed as both `coa` and `eggs` — your existing commands (`eggs produce`, `eggs kill`, …) work unchanged. See the [Quick Start](./DOCS/manual/quickstart.md) for the full compatibility table.

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
The **oa-tools** project aims to provide a "Passepartout" for Linux remastering. By separating the **Mind** (Go) from the **Workhorse** (C), we achieve a clean, maintainable, and incredibly fast workflow that can adapt to any distribution without changing the user experience.

Documentation about oa-tools can be found on [DOCS](./DOCS/README.md). See also the [Manifestum](./DOCS/manifestum.md) for the founding vision and origins.

The article [eggs-bananas](https://penguins-eggs.net/blog/eggs-bananas) philosophy can be read on my blog.

[![coaoa](./coaoa.jpeg "Visit the Penguins' eggs Telegram channel")](https://t.me/penguins_eggs)


## Star History

This project collects stars, look to the sky... contribute!

[![Star History Chart](https://api.star-history.com/svg?repos=pieroproietti/oa-tools&type=Date)](https://star-history.com/#pieroproietti/oa-tools&Date)

---
*Created with passion by Piero Proietti.*

### blog ed AI
* [https://penguins-eggs.net](https://penguins-eggs.net)
* [llms.txt](https://penguins-eggs.net/llms.txt)
