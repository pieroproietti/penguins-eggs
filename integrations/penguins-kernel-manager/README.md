# penguins-kernel-manager

Install, build, and manage Linux kernels across all major distributions and CPU
architectures from a single CLI or GUI.

Forked from [lkm](https://github.com/Interested-Deving-1896/lkm) and rebranded
as part of the **penguins ecosystem** alongside
[penguins-eggs](https://github.com/Interested-Deving-1896/penguins-eggs) and
[penguins-recovery](https://github.com/Interested-Deving-1896/penguins-recovery).

Merges **lkf** (Linux Kernel Framework — shell build pipeline) and **ukm**
(Universal Kernel Manager — runtime management) into one tool covering the full
kernel lifecycle:

```
fetch → patch → configure → compile → package → install → hold → remove
```

---

## penguins-eggs & penguins-recovery integration

penguins-kernel-manager has **bidirectional** integration with the penguins
ecosystem:

### penguins-kernel-manager → penguins-eggs / penguins-recovery

| Event | Action |
|---|---|
| Pre-install | Calls `penguins-recovery snapshot create pre-kernel-<version>` if recovery is present |
| Post-install | Notifies eggs via `eggs kernel-changed` hook so the next ISO reflects the new kernel |
| Pre-remove | Warns if the kernel being removed is the one embedded in the last eggs ISO |
| Post-remove-old | Triggers `eggs produce --update-kernel-list` (non-blocking, best-effort) |

Configure in `/etc/penguins-kernel-manager/hooks.conf`:

```toml
[hooks]
eggs_bin        = "/usr/bin/eggs"          # set to "" to disable
recovery_bin    = "/usr/bin/penguins-recovery"
pre_install_snapshot  = true
post_install_notify   = true
pre_remove_warn       = true
post_remove_old_sync  = false              # set true to rebuild ISO automatically
```

### penguins-eggs / penguins-recovery → penguins-kernel-manager

penguins-kernel-manager registers itself as a plugin for both tools:

**eggs plugin** (`integration/eggs-plugin/pkm-hook.sh`):
- Called by `eggs produce` to embed the currently managed kernel list into the ISO
- Called by `eggs update` to check for held kernels before updating

**recovery plugin** (`integration/recovery-plugin/pkm-plugin.sh`):
- Registered as a `distro`-type powerwash plugin
- `pw_plugin_pre_reset()` — snapshots the kernel state before a factory reset
- `pw_plugin_post_reset()` — reinstalls the held kernel after a hard reset

---

## Kernel sources

| Source | Architectures |
|---|---|
| Ubuntu Mainline PPA | amd64, arm64, armhf, ppc64el, s390x, i386 |
| XanMod | amd64 (v1–v4, edge, lts, rt) |
| Liquorix | amd64 |
| Distro-native (system package manager) | all |
| Gentoo source compilation | all |
| Local file (.deb / .rpm / .pkg.tar.* / .apk / .xbps) | all |
| **lkf build** (compile from source via lkf profiles) | all |

## Distributions supported

Any distro using one of: `apt`, `pacman`, `dnf`, `zypper`, `apk`, `portage`,
`xbps`, `nix`.

---

## Install

```bash
# CLI only
pip install penguins-kernel-manager

# GUI (PySide6 — recommended, LGPL)
pip install "penguins-kernel-manager[pyside6]"

# GUI (PyQt6 — alternative, GPL)
pip install "penguins-kernel-manager[pyqt6]"
```

---

## CLI usage

```bash
penguins-kernel-manager list
penguins-kernel-manager install 6.12.0
penguins-kernel-manager remove 6.8.0
penguins-kernel-manager hold   6.12.0
penguins-kernel-manager unhold 6.12.0
penguins-kernel-manager remove-old --keep=2
penguins-kernel-manager info

# Build from lkf profile
penguins-kernel-manager remix --file ~/.local/share/lkf/profiles/gaming.toml --install
penguins-kernel-manager build --version 6.12 --flavor mainline --llvm --lto thin --output deb --install

# Legacy short alias
pkm list
```

## GUI

```bash
penguins-kernel-manager-gui
# or
pkm-gui
```

---

## Development

```bash
git clone https://github.com/Interested-Deving-1896/penguins-kernel-manager
cd penguins-kernel-manager
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

pytest
ruff check penguins_kernel_manager/
mypy penguins_kernel_manager/
```

---

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).

## Upstream

Forked from [Interested-Deving-1896/lkm](https://github.com/Interested-Deving-1896/lkm),
which merges:
- [lkf](https://github.com/Interested-Deving-1896/lkf) — Linux Kernel Framework
- [ukm](https://github.com/Interested-Deving-1896/ukm) — Universal Kernel Manager
