# penguins-powerwash

A distro-agnostic, filesystem-agnostic factory reset tool for Linux.

Forked from [linux-powerwash](https://github.com/Interested-Deving-1896/linux-powerwash)
and rebranded as part of the **penguins ecosystem** alongside
[penguins-eggs](https://github.com/Interested-Deving-1896/penguins-eggs) and
[penguins-recovery](https://github.com/Interested-Deving-1896/penguins-recovery).

---

## penguins-eggs & penguins-recovery integration

penguins-powerwash has **bidirectional** integration with the penguins ecosystem.

### penguins-powerwash → penguins-eggs / penguins-recovery

| Event | Action |
|---|---|
| Pre-reset (any mode) | Calls `eggs produce --naked` to snapshot the live system state before wiping |
| Pre-reset (any mode) | Calls `penguins-recovery snapshot create pre-powerwash-<mode>` if recovery is present |
| Post-reset (hard/sysprep) | Calls `penguins-recovery adapter.sh` to re-layer recovery tools onto the reset system |
| Post-backup | Notifies eggs so the backup path is recorded in the next ISO manifest |

Configure in `/etc/penguins-powerwash/eggs-hooks.conf`:

```bash
EGGS_BIN="/usr/bin/eggs"              # set to "" to disable
RECOVERY_BIN="/usr/bin/penguins-recovery"
PRE_RESET_SNAPSHOT=1                  # create recovery snapshot before reset
PRE_RESET_EGGS_PRODUCE=0              # set 1 to produce a naked ISO before reset
POST_HARD_RESET_ADAPT=1               # re-layer recovery tools after hard reset
```

### penguins-eggs / penguins-recovery → penguins-powerwash

penguins-powerwash registers itself as a plugin for penguins-recovery:

**recovery plugin** (`integration/recovery-plugin/powerwash-plugin.sh`):
- `pw_plugin_pre_reset()` — no-op (powerwash IS the reset tool)
- `pw_plugin_post_reset()` — re-runs `penguins-powerwash info` to confirm clean state

penguins-powerwash also ships an **eggs plugin** (`integration/eggs-plugin/powerwash-hook.sh`):
- Called by `eggs produce` to embed the powerwash binary and config into the ISO
- Adds a GRUB menu entry for "Factory Reset" that boots into powerwash hard mode

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

---

## Installation

```bash
git clone https://github.com/Interested-Deving-1896/penguins-powerwash
cd penguins-powerwash
sudo make install
```

---

## Usage

```bash
sudo penguins-powerwash soft
sudo penguins-powerwash medium
sudo penguins-powerwash hard
sudo penguins-powerwash sysprep --shutdown
sudo penguins-powerwash --dry-run hard
sudo penguins-powerwash backup create --encrypt
sudo penguins-powerwash snapshot create my-label
sudo penguins-powerwash info
sudo penguins-powerwash menu
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

## License

GPL-3.0. See [LICENSE](LICENSE).

## Upstream

Forked from [Interested-Deving-1896/linux-powerwash](https://github.com/Interested-Deving-1896/linux-powerwash).
