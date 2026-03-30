# lkm — Linux Kernel Manager

Install, build, and manage Linux kernels across all major distributions and CPU architectures from a single CLI or GUI.

Merges **[lkf](https://github.com/Interested-Deving-1896/lkf)** (Linux Kernel Framework — shell build pipeline) and **[ukm](https://github.com/Interested-Deving-1896/ukm)** (Universal Kernel Manager — runtime management) into one tool covering the full kernel lifecycle:

```
fetch → patch → configure → compile → package → install → hold → remove
```

---

## Kernel sources

| Source | Architectures |
|---|---|
| Ubuntu Mainline PPA | amd64, arm64, armhf, ppc64el, s390x, i386 |
| XanMod | amd64 (v1–v4, edge, lts, rt) |
| Liquorix | amd64 |
| Distro-native (via system package manager) | all |
| Gentoo source compilation | all |
| Local file (.deb / .rpm / .pkg.tar.* / .apk / .xbps) | all |
| **lkf build** (compile from source via lkf profiles) | all |

## Distributions supported

Any distro using one of these package managers:

| Package manager | Distros |
|---|---|
| `apt` | Debian, Ubuntu, Mint, Pop!\_OS, Kali, Kubuntu, Xubuntu, Lubuntu, Devuan, MX Linux, antiX, Zorin, elementary, KDE neon, SparkyLinux, BunsenLabs, Parrot, Proxmox, PikaOS, Bodhi, Lite, Emmabuntüs, Voyager, Linuxfx, Kodachi, AV Linux, wattOS, Feren, Peppermint, Q4OS, Ubuntu MATE, Ubuntu Studio, DragonOS, … |
| `pacman` | Arch, Manjaro, EndeavourOS, CachyOS, Artix, RebornOS, ArchBang, Archcraft, Bluestar, Mabox, … |
| `dnf` | Fedora, RHEL, AlmaLinux, Rocky, Nobara, Ultramarine, Bazzite, Oracle, Red Hat, … |
| `zypper` | openSUSE Leap, openSUSE Tumbleweed, SLES, Regata, … |
| `apk` | Alpine Linux |
| `portage` | Gentoo |
| `xbps` | Void Linux |
| `nix` | NixOS |

---

## Install

```sh
# CLI only
pip install lkm

# GUI (PySide6 — recommended, LGPL)
pip install "lkm[pyside6]"

# GUI (PyQt6 — alternative, GPL)
pip install "lkm[pyqt6]"
```

To force a specific Qt binding at runtime:

```sh
LKM_QT=PyQt6 lkm-gui
```

---

## CLI usage

### Runtime management

```sh
lkm list                            # all kernels from all sources
lkm list --family=xanmod            # filter by family
lkm list --installed                # installed only
lkm list --json                     # machine-readable output
lkm list --refresh                  # force re-fetch remote indexes

lkm install 6.12.0                  # install by version
lkm install 6.12.0 --flavor=rt      # install specific flavor
lkm install 6.12.0 --provider=xanmod
lkm install --local ./linux-image-6.12.0_amd64.deb

lkm remove 6.8.0
lkm remove 6.8.0 --purge            # also remove config files

lkm hold   6.12.0                   # pin kernel (excluded from auto-upgrades)
lkm unhold 6.12.0

lkm note 6.12.0 "stable, use this"  # attach a note to a kernel

lkm remove-old                      # remove all but running + most recent
lkm remove-old --keep=2             # keep 2 most recent

lkm providers                       # list available providers
lkm info                            # system info (distro, arch, running kernel)
```

### Building with lkf

Requires [lkf](https://github.com/Interested-Deving-1896/lkf) to be installed (`make install` from the lkf repo).

```sh
# Build from a remix.toml profile and install the result
lkm remix --file ~/.local/share/lkf/profiles/gaming.toml --install

# Build mainline 6.12 with Clang/LLVM + thin LTO, produce a .deb, then install
lkm build --version 6.12 --flavor mainline --llvm --lto thin --output deb --install

# Build without installing (package lands in ~/.cache/lkm/lkf-output/)
lkm build --version 6.12 --flavor tkg --arch aarch64 --output rpm
```

---

## GUI

```sh
lkm-gui
```

The GUI shows a tabbed window — one tab per kernel family plus an **All** tab. Each tab has a search bar, family/status filters, a sortable kernel table, and a live log panel at the bottom.

Right-click any kernel row for: Install / Remove / Hold / Unhold / Edit Note.

### Build tab

The **⚙ Build…** toolbar button opens the lkf build dialog with two modes:

- **Profile** — pick a `remix.toml` from discovered lkf profiles (or browse for one). Streams `lkf remix` output live.
- **Custom** — specify version, flavor, arch, compiler flags (LLVM/LTO), and output format. Streams `lkf build` output live.

On a successful build, lkm offers to install the resulting package immediately.

---

## Architecture

```
lkm/
├── qt.py                        # PySide6/PyQt6 compatibility shim
├── core/
│   ├── kernel.py                # KernelEntry, KernelVersion, KernelFamily, KernelStatus
│   ├── system.py                # distro/arch/package-manager detection
│   ├── manager.py               # KernelManager — central coordinator, state persistence
│   ├── backends/                # Package manager backends
│   │   ├── apt.py               # Debian / Ubuntu / Mint / …
│   │   ├── pacman.py            # Arch / Manjaro / CachyOS / …
│   │   ├── dnf.py               # Fedora / RHEL / AlmaLinux / …
│   │   ├── zypper.py            # openSUSE
│   │   ├── apk.py               # Alpine
│   │   ├── portage.py           # Gentoo
│   │   ├── xbps.py              # Void Linux
│   │   └── nix.py               # NixOS
│   └── providers/               # Kernel source providers
│       ├── mainline.py          # Ubuntu Mainline PPA
│       ├── xanmod.py            # XanMod
│       ├── liquorix.py          # Liquorix
│       ├── distro.py            # Distro-native packages
│       ├── local_file.py        # Pre-built local package files
│       ├── lkf_build.py         # lkf build pipeline bridge
│       ├── gentoo.py            # Gentoo source compilation
│       ├── void.py              # Void Linux (xbps)
│       └── nixos.py             # NixOS (declarative)
├── cli/
│   ├── main.py                  # CLI entry point
│   └── output.py                # Colour output, tables, JSON mode
└── gui/
    ├── app.py                   # QApplication entry point + stylesheet
    ├── kernel_model.py          # QAbstractTableModel for KernelEntry lists
    ├── main_window.py           # Main window (toolbar, tabs, log panel)
    └── widgets/
        ├── kernel_view.py       # Filterable, sortable kernel table
        ├── log_panel.py         # Collapsible live log panel
        ├── lkf_build_dialog.py  # lkf build dialog (Profile + Custom modes)
        ├── gentoo_compile_dialog.py
        └── note_dialog.py
```

Adding a new kernel source: implement `KernelProvider` in `lkm/core/providers/` and register it in `lkm/core/providers/__init__.py`.

Adding a new package manager: implement `PackageBackend` in `lkm/core/backends/` and register it in `lkm/core/backends/__init__.py` and `lkm/core/system.py`.

---

## Development

```sh
git clone https://github.com/Interested-Deving-1896/lkm
cd lkm
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# Run tests
pytest

# Lint
ruff check lkm/

# Type check
mypy lkm/

# Launch GUI
lkm-gui

# Launch CLI
lkm info
lkm list
```

---

## Notes on specific providers

**Ubuntu Mainline PPA** — packages are unsigned and will not boot with Secure Boot enabled. lkm warns at startup if Secure Boot is detected.

**XanMod / Liquorix** — x86-64 only. On first use, lkm offers to add the required apt repository and signing key automatically.

**lkf build** — requires [lkf](https://github.com/Interested-Deving-1896/lkf) on PATH. Set `LKF_ROOT` to point lkm at a non-standard lkf installation. Build output lands in `~/.cache/lkm/lkf-output/` by default; override with `LKF_OUTPUT_DIR`.

**Gentoo** — `lkm build` (via lkf) prints the interactive `make menuconfig` command for you to run in a terminal. The GUI Gentoo compile dialog streams the full build output live.

**NixOS** — kernel selection is declarative. lkm emits the `boot.kernelPackages` configuration snippet and optionally runs `nixos-rebuild switch`. It does not edit `configuration.nix` directly. Run lkm inside a `nix-shell` (or `nix develop`) to ensure build tools are on PATH.

---

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).

## Origins

lkm is a merger of:
- **[lkf](https://github.com/Interested-Deving-1896/lkf)** — Linux Kernel Framework (shell, build pipeline)
- **[ukm](https://github.com/Interested-Deving-1896/ukm)** — Universal Kernel Manager (Python, runtime management)
