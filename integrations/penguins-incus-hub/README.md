# penguins-incus-hub

Integration layer connecting
[penguins-incus-platform](https://github.com/Interested-Deving-1896/penguins-incus-platform)
(PIP) with [penguins-eggs](https://github.com/Interested-Deving-1896/penguins-eggs).

PIP is a unified Incus container and VM management platform — Qt6/QML desktop
UI, React web UI, and CLI — with provisioning plugins for generic Linux
containers, Waydroid (Android), macOS KVM, and Windows VMs.

This hub embeds the PIP daemon and CLI into produced ISOs so that any
penguins-eggs live system can manage Incus guests out of the box.

---

## What it does

| Event | Action |
|---|---|
| `eggs produce` (post) | Copies `penguins-incus-daemon` binary + profiles into the ISO |
| `eggs produce` (post) | Writes a systemd unit so the daemon auto-starts in the live environment |
| `eggs produce` (post) | Copies the `penguins-incus` CLI into the ISO |
| Pre-reset (any powerwash mode) | Snapshots all running Incus instances via `penguins-incus snapshot create` |
| Post-hard-reset | Restarts the PIP daemon and re-applies default profiles |

---

## Hook configuration

`/etc/penguins-incus-hub/eggs-hooks.conf`:

```bash
# Path to the penguins-incus-platform installation
PIP_ROOT="/usr/lib/penguins-incus-platform"

# Embed the PIP daemon into produced ISOs (default: 1)
EMBED_DAEMON=1

# Embed the penguins-incus CLI into produced ISOs (default: 1)
EMBED_CLI=1

# Snapshot Incus instances before any powerwash reset (default: 1)
PRE_RESET_SNAPSHOT=1

# Restart daemon after hard reset (default: 1)
POST_HARD_RESET_RESTART=1
```

---

## Installation

```bash
git clone https://github.com/Interested-Deving-1896/penguins-incus-platform
cd penguins-incus-platform
pip install -e "penguins-incus-platform/daemon[dev]"
pip install -e "penguins-incus-platform/cli[dev]"

# Register the eggs plugin
sudo ln -s /usr/share/penguins-incus-hub/integration/eggs-plugin/pip-hook.sh \
           /usr/share/penguins-eggs/plugins/pip-hook.sh
```

---

## Directory layout

```
penguins-incus-hub/
├── README.md
├── INTEGRATIONS.md
├── bin/
│   └── penguins-incus-hub          # management helper (install, status, uninstall)
├── conf/
│   └── eggs-hooks.conf.default     # default hook configuration
├── lib/
│   └── common.sh                   # shared shell helpers
└── integration/
    ├── eggs-plugin/
    │   ├── README.md
    │   └── pip-hook.sh             # called by eggs produce
    └── recovery-plugin/
        ├── README.md
        └── pip-recovery-plugin.sh  # called by penguins-recovery pre/post reset
```
