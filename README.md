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

## oa-tools: 🐧A Next-Generation Linux Remastering Suite

Welcome to **oa-tools**, the next step in the evolution of [penguins-eggs](https://github.com/pieroproietti/penguins-eggs). This monorepo introduces a split-responsibility architecture engineered for high-performance system remastering. By leveraging our "Universal Strategy," *oa-tools* guarantees absolute portability across distributions.

Under the hood, the project is powered by two distinct entities: **oa** (the workhorse handling the heavy lifting) and **coa** (the orchestrator managing the workflow).

**coa** is the only component you interact with directly, while **oa** is used by **coa** to execute its JSON-based remastering plans. To provide maximum flexibility, you can interact with the system interchangeably using the new `coa` command or the legacy `eggs` alias.

---
**Support the project:**  
[![Donate](https://img.shields.io/badge/Donate-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/penguinseggs)

## 🏗 oa-tools Architecture

We have transitioned to a monorepo structure to ensure perfect synchronization between the workhorse (oa) and the orchestrator (coa).

### 🦾 [oa](./DOCS/README.md) (**eggs in my dialect**) - The Workhorse
**Language: C**
`oa` is the low-level engine. It handles the "heavy lifting" of the system:
- Managing OverlayFS and mount points.
- Executing SquashFS compression.
- Remove and create users and groupt via yocto_style functions.
- Interacting directly with the Linux Kernel and system binaries.
- **Philosophy:** Performance, stability, and zero-dependency execution.

### 🧠 [coa](./DOCS/README.md) (**brooding in my dialect**) - The Orchestrator
It manages the full lifecycle: from laying the ISO to the final installation.

The name derives from the dialect word coa, referring to the act of brooding or incubating eggs until they are ready to hatch.

**Language: Go**

For coa commands, see [coa command Reference](/DOCS/COA_COMMANDS.md).


## 🚀 Getting Started

### Prerequisites
- A Linux system (Debian-based, Arch-based. Fedora-based or Manjaro-based).
- `gcc` and `make` (for `oa`).
- `golang` 1.21+ (for `coa`).

### Build Everything
From this root directory, simply run:
```bash
make
```

This will compile both binaries:
- `./oa/oa` (The Engine)
- `./coa/coa` (The Orchestrator)

> TIP: You can create native package like: .deb, PKGBUILD, rpm using
```
coa/coa build
```

---

## 📜 Philosophy
The **oa-tools** project aims to provide a "Passepartout" for Linux remastering. By separating the **Mind** (Go) from the **Workhorse** (C), we achieve a clean, maintainable, and incredibly fast workflow that can adapt to any distribution without changing the user experience.

Documentation about oa-tools can be found on [DOCS](/DOCS/).

The article [eggs-bananas](https://penguins-eggs.net/blog/eggs-bananas) philosophy can be read on my blog.

![coaoa](./coaoa.jpeg)


---
*Created with passion by Piero Proietti.*