# Linux Powerwash

A distro-agnostic, filesystem-agnostic factory reset tool for Linux.

Unifies the best ideas from a dozen scattered projects into a single, coherent tool with a consistent interface, a plugin architecture, and mandatory pre-reset backups.

---

## Features

| Capability | Details |
|---|---|
| **Distro support** | Debian, Ubuntu, Fedora, RHEL, Arch, openSUSE, Gentoo, Void — auto-detected |
| **Filesystem support** | ext4, xfs, btrfs (native snapshots), ZFS (native snapshots), overlayfs |
| **Reset modes** | Soft, Medium, Hard, Sysprep, Hardware |
| **Backup** | Pre-reset backup with optional GPG symmetric encryption |
| **Dry-run** | `--dry-run` prints every action without executing it |
| **Plugin system** | Drop `.sh` files into `plugins/{distro,filesystem,hardware}/` |
| **Hardware reset** | sysfs unbind/rebind (USB/PCI), vendor-reset GPU module integration |
| **systemd service** | Auto-rebind devices on resume from sleep |
| **TUI menu** | `powerwash menu` for interactive use |

---

## Installation

```bash
git clone https://github.com/linux-powerwash/linux-powerwash
cd linux-powerwash
sudo make install
```

To uninstall:

```bash
sudo make uninstall
```

---

## Usage

```
powerwash [--dry-run] <command> [options]
```

### Reset modes

```bash
# Clear user dotfiles only — safe, non-destructive
sudo powerwash soft

# Remove user-installed packages and reset dotfiles
sudo powerwash medium

# Full factory reset: packages, home dirs, system config
sudo powerwash hard

# Generalize for disk imaging (clears machine-id, SSH keys, network state)
sudo powerwash sysprep --shutdown
```

### Preview before committing

Every command supports `--dry-run`. Nothing is modified:

```bash
sudo powerwash --dry-run hard
```

### Backup

```bash
# Create a backup before resetting manually
sudo powerwash backup create

# Create an encrypted backup
sudo powerwash backup create --encrypt

# List backups
sudo powerwash backup list

# Restore packages from a backup
sudo powerwash backup restore-packages /var/lib/powerwash/backups/backup_20240101_120000
```

### Filesystem snapshots

```bash
# Create a snapshot (btrfs or ZFS only)
sudo powerwash snapshot create my-label

# List snapshots
sudo powerwash snapshot list

# Roll back
sudo powerwash snapshot rollback my-label
```

### Hardware device reset

```bash
# List devices and their sysfs BUS IDs
sudo powerwash hardware list

# Rebind a USB controller after resume
sudo powerwash hardware rebind 0000:00:14.0

# Trigger AMD GPU vendor-reset (requires gnif/vendor-reset module)
sudo powerwash hardware vendor-reset 0000:01:00.0
```

### System info

```bash
powerwash info
```

### Interactive menu

```bash
sudo powerwash menu
```

---

## Reset mode comparison

| Mode | Dotfiles | Packages | Home data | System config | Machine ID |
|---|---|---|---|---|---|
| `soft` | ✓ reset | unchanged | unchanged | unchanged | unchanged |
| `medium` | ✓ reset | ✓ purged | unchanged | ✓ sources reset | unchanged |
| `hard` | ✓ reset | ✓ purged | ✓ wiped | ✓ reset | unchanged |
| `sysprep` | unchanged | unchanged | unchanged | ✓ reset | ✓ cleared |

---

## Device rebind on resume

To automatically rebind devices after the system wakes from sleep:

```bash
# Edit the config and add your device BUS IDs
sudo nano /etc/powerwash/rebind-devices.conf

# Enable the service
sudo systemctl enable --now powerwash-rebind.service
```

Find BUS IDs with `powerwash hardware list` or `lspci -D | grep USB`.

---

## Plugin system

Plugins are shell scripts in `plugins/{distro,filesystem,hardware}/`. They are auto-loaded when their `PW_PLUGIN_MATCH` regex matches the detected distro ID or filesystem type.

### Plugin contract

```bash
PW_PLUGIN_NAME="my-plugin"       # unique name
PW_PLUGIN_TYPE="distro"          # distro | filesystem | hardware
PW_PLUGIN_MATCH="ubuntu|debian"  # regex matched against distro ID

# Optional hooks:
pw_plugin_pre_reset()  { ... }
pw_plugin_post_reset() { ... }
pw_plugin_pre_backup() { ... }
```

### Bundled plugins

| Plugin | Type | Trigger |
|---|---|---|
| `ubuntu-ppa-cleanup` | distro | Ubuntu, Mint, Pop, Elementary |
| `btrfs-auto-snapshot` | filesystem | btrfs root |
| `amd-gpu-vendor-reset` | hardware | always (checks for AMD GPU) |

List all plugins:

```bash
powerwash plugins
```

---

## Architecture

```
linux-powerwash/
├── bin/
│   └── powerwash              # main entrypoint
├── lib/
│   ├── common.sh              # logging, pw_run, dry-run gate
│   ├── distro.sh              # distro detection + pkg manager abstraction
│   ├── filesystem.sh          # fs detection + btrfs/zfs snapshot abstraction
│   ├── backup.sh              # pre-reset backup subsystem
│   └── plugin.sh              # plugin loader and hook dispatcher
├── modes/
│   ├── soft.sh                # dotfile reset
│   ├── medium.sh              # package + dotfile reset
│   ├── hard.sh                # full factory reset
│   ├── sysprep.sh             # OEM generalization
│   └── hardware.sh            # device rebind + vendor-reset
├── plugins/
│   ├── distro/
│   │   └── ubuntu-ppa.sh
│   ├── filesystem/
│   │   └── btrfs-snapshot.sh
│   └── hardware/
│       └── amd-gpu.sh
├── systemd/
│   ├── powerwash-rebind.service
│   ├── powerwash-rebind.conf
│   └── rebind-helper
├── docs/
│   └── powerwash.1            # man page
├── tests/
├── contrib/
├── Makefile
└── README.md
```

---

## Lineage

Linux Powerwash synthesizes ideas from these prior projects:

| Project | Contribution |
|---|---|
| [gaining/Resetter](https://github.com/gaining/Resetter) | GUI reset concept, APT package diffing |
| [gaining/resetter-cli](https://github.com/gaining/resetter-cli) | Terminal UI reset concept |
| [cazique/resetter-for-linux](https://github.com/cazique/resetter-for-linux) | Soft/full reset levels, GPG backup, dry-run, multi-distro |
| [teejee2008/aptik](https://github.com/teejee2008/aptik) | Backup scope (repos, fonts, cron, fstab, home) |
| [thekaleabsamuel/oem-sysprep](https://github.com/thekaleabsamuel/oem-sysprep) | Sysprep/generalize concept |
| [sgnconnects/Linux-factory-reset](https://github.com/sgnconnects/Linux-factory-reset) | Partition-level factory image concept |
| [bulletmark/rebind-devices](https://github.com/bulletmark/rebind-devices) | sysfs unbind/rebind on resume |
| [gnif/vendor-reset](https://github.com/gnif/vendor-reset) | GPU vendor-reset module integration |
| [nuageeee/reset-linux](https://github.com/nuageeee/reset-linux) | Dart/rootfs restore concept |
| [ToastCoder/restore-env](https://github.com/ToastCoder/restore-env) | Multi-family shell script structure |
| [justincpresley/os-newify](https://github.com/justincpresley/os-newify) | OS hardening and cleanup checklist |

---

## License

GPL-3.0. See [LICENSE](LICENSE).
