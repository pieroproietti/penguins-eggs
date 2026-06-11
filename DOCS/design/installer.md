# Design Doc — `sysinstall`: Architecture & Design

> **Status: design document.** This describes the target architecture for the unified installer. The `dispatcher` and `krill` packages already exist in the codebase; the remaining phases are tracked in the [roadmap](./roadmap.md).

This document defines the architecture, goals and structure of the unified `sysinstall` package inside `oa-tools`.

## 1. The Vision: One Engine, Two Faces
The goal of `sysinstall` is to make the installation process completely agnostic with respect to the user interface, in line with our **Universal Strategy**. Instead of maintaining two separate flows for graphical and terminal installation, the system uses a single "brain" orchestrating the operation, dynamically deciding which "face" to show the user based on the execution environment.

* **GUI (Graphical User Interface):** delegated to **Calamares**.
* **TUI (Text User Interface):** delegated to **Krill** (the native console mode of `oa-tools`).

## 2. The Single Source of Truth
To avoid divergence, both Calamares and Krill must read exactly the same configuration files.
We abandon the fragmentation of the standard directories and centralize everything in:
`/etc/oa-tools/installer.d/`

This directory contains the `.conf` files (YAML-compatible syntax):
* `settings.conf`: the master file defining the module sequence (`show`, `exec`).
* `branding.desc`: logos, names (e.g. `VOL_ID`) and support URLs.
* `modules/*.conf`: the specific configurations for partitioning, user creation, network, etc.

**Golden rule:** if a user or a template modifies `settings.conf`, the change is instantly reflected in both installers.

## 3. The Execution Flow (The Dispatcher)
When the installation command is launched (`coa sysinstall` or the legacy `eggs sysinstall`), the dispatcher acts as an intelligent selector:

1.  **Environment check:** verifies the presence of an active display server (X11 or Wayland).
2.  **Binary check:** verifies that the `calamares` executable is in `$PATH`.
3.  **Routing:**
    * **If GUI available && Calamares present:** launches `calamares -d -c /etc/oa-tools/installer.d/settings.conf`.
    * **If no GUI || Calamares missing (fallback):** runs the internal routine launching the **Krill** text interface, with the same configuration path.

## 4. Go Package Architecture
The source code is structured with a plugin design separating the reading logic from the presentation:

```
sysinstall/
├── engine/        # Parser for the .conf/.yaml files. Builds the InstallationPlan.
├── adapters/
│   ├── calamares/ # Wrapper launching the C++ process and passing it symlinks/config.
│   └── krill/     # Native Go TUI implementation (terminal interfaces).
└── modules/       # The actual executive logic for Krill (e.g. run_partition, run_users).
```

### 4.1 Krill as a "Calamares-Core-Runner"
Krill is not an independent installer but a textual interpreter of Calamares:
* It reads `settings.conf`.
* It ignores the purely aesthetic modules (e.g. animated `welcome` slides).
* It maps the logical Calamares modules onto its own Go functions (e.g. when it meets `- partition` in the `exec` phase, Krill launches its own interaction logic with `parted`/`sfdisk`).

## 5. Development Roadmap

1.  **Phase 1 — Repository unification:** rename the currently isolated packages into `sysinstall`.
2.  **Phase 2 — The base parser (`engine`):** write the Go structs needed to parse `settings.conf` and `branding.desc`.
3.  **Phase 3 — The logical switch (`dispatcher`):** the logic deciding whether to start Calamares or Krill. *(A `dispatcher` package exists in the codebase.)*
4.  **Phase 4 — Krill UI:** read the sequence (`InstallationPlan`) and build the corresponding TUI screens. Candidate library: **Bubbletea** (charmbracelet).
5.  **Phase 5 — Krill execution:** connect the TUI modules to the system commands performing the physical installation.

## Starting Point

The existing `calamares` package is used in two ways (configuration generation on the live system and bootloader preparation, see `prepare_oa_bootloader.go`); the unification described above starts from there.
