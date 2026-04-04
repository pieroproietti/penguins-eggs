# penguins-incus-hub — integration details

## Upstream

| Field | Value |
|---|---|
| Repository | https://github.com/Interested-Deving-1896/penguins-incus-platform |
| Language | Python (daemon + CLI), TypeScript (web UI), C++/QML (desktop UI) |
| License | GPL-3.0-or-later (daemon, CLI, web UI); LGPL-2.1-or-later (libpenguins-incus-qt) |

## Eggs plugin hook points

| `EGGS_HOOK` | Trigger | Action |
|---|---|---|
| `produce` (post) | `eggs produce` | Embeds PIP daemon binary, CLI, profiles, and systemd unit into the ISO |
| `update` | `eggs update` | Re-embeds if PIP version changed |

## Recovery plugin hook points

| Hook | Trigger | Action |
|---|---|---|
| `pre-reset` | Any powerwash mode | Snapshots all running Incus instances |
| `post-hard-reset` | `penguins-powerwash hard` or `sysprep` | Restarts PIP daemon; re-applies default Incus profiles |

## Guest types supported

| Guest type | Provisioning plugin | CLI entry point |
|---|---|---|
| Generic Linux containers | `provisioning/generic.py` | `penguins-incus provision generic` |
| Waydroid (Android) containers | `provisioning/waydroid.py` | `penguins-incus provision waydroid` |
| macOS KVM VMs | `provisioning/macos.py` | `penguins-incus provision macos` |
| Windows VMs | `provisioning/windows.py` | `penguins-incus provision windows` |

## Acceptance criteria

- [ ] `eggs produce` on a system with PIP installed produces an ISO where
      `penguins-incus-daemon` starts automatically in the live environment
- [ ] `penguins-incus container list` works inside the live ISO without
      additional setup
- [ ] Pre-reset hook creates an Incus snapshot for each running instance
- [ ] Post-hard-reset hook restarts the daemon and re-applies profiles
