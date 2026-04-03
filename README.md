# penguins-distrobuilder

Unified project combining [lxc/distrobuilder](https://github.com/lxc/distrobuilder)
and [itoffshore/distrobuilder-menu](https://github.com/itoffshore/distrobuilder-menu)
into a single repository, integrated with
[penguins-eggs](https://github.com/Interested-Deving-1896/penguins-eggs).

## Layout

```
penguins-distrobuilder/
├── distrobuilder/   # lxc/distrobuilder — Go, system container & VM image builder
├── menu/            # itoffshore/distrobuilder-menu — Python TUI frontend
├── integration/     # penguins-eggs hook and recovery plugin
│   ├── eggs-plugin/
│   └── recovery-plugin/
├── Makefile         # top-level targets: build, install, run-menu, clean
└── README.md
```

## Components

### distrobuilder (Go)

System container and VM image builder for [Incus](https://github.com/lxc/incus)
and LXC. Builds rootfs images from YAML template definitions.

| Command | Purpose |
|---|---|
| `distrobuilder build-dir` | Build plain rootfs |
| `distrobuilder build-incus` | Build Incus image from scratch |
| `distrobuilder build-lxc` | Build LXC image from scratch |
| `distrobuilder pack-incus` | Create Incus image from existing rootfs |
| `distrobuilder pack-lxc` | Create LXC image from existing rootfs |
| `distrobuilder repack-windows` | Repack Windows ISO with drivers |

Source: [`distrobuilder/`](distrobuilder/) — upstream: https://github.com/lxc/distrobuilder

### distrobuilder-menu (Python)

Console TUI frontend for distrobuilder. Menu-driven LXD/LXC image building
with template management, cloud-init config, custom template generation, and
automatic template updates via the GitHub REST API.

| Command | Purpose |
|---|---|
| `dbmenu` | Build LXD container/VM image (default) |
| `dbmenu --lxc` | Build LXC container image |
| `dbmenu -o` | Create new template override |
| `dbmenu -g` | Generate custom template from override |
| `dbmenu -i` | Create/edit cloud-init configuration |
| `dbmenu -u` | Force update templates |
| `dbmenu -v` | Show version / update to latest release |
| `dbmenu -r` | Regenerate custom templates |

Config: `~/.config/dbmenu.yaml` (auto-generated on first run)

Source: [`menu/`](menu/) — upstream: https://github.com/itoffshore/distrobuilder-menu

## Quick start

```bash
# Build distrobuilder from source
make build

# Install distrobuilder binary + dbmenu
make install

# Launch the TUI menu (LXD mode)
make run-menu

# Launch the TUI menu (LXC mode)
make run-menu-lxc
```

## penguins-eggs integration

The `integration/eggs-plugin/` hook is called by `eggs produce` to optionally
build a distrobuilder image of the produced system alongside the standard ISO.
The `integration/recovery-plugin/` hook snapshots the current container state
before a factory reset.

See [`integration/`](integration/) for details.

## Dependencies

- **distrobuilder:** Go 1.21+, `squashfs-tools`, `debootstrap` or equivalent
- **distrobuilder-menu:** Python 3.10+, `pyyaml`, `urllib3`, `yq` (Go version 4+), `incus` or `lxd`

## Upstream licenses

- `distrobuilder/` — Apache-2.0 (lxc/distrobuilder)
- `menu/` — GPL-3.0 (itoffshore/distrobuilder-menu)
