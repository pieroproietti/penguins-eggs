# penguins-immutable-framework (PIF)

A distro-agnostic, architecture-agnostic framework for building immutable Linux
distributions.

Forked from [immutable-linux-framework](https://github.com/Interested-Deving-1896/immutable-linux-framework)
and rebranded as part of the **penguins ecosystem** alongside
[penguins-eggs](https://github.com/Interested-Deving-1896/penguins-eggs) and
[penguins-recovery](https://github.com/Interested-Deving-1896/penguins-recovery).

Distro builders choose one or more immutability backends at build time; the
framework provides a unified HAL and CLI surface on top.

---

## penguins-eggs & penguins-recovery integration

penguins-immutable-framework has **bidirectional** integration with the penguins
ecosystem.

### penguins-immutable-framework → penguins-eggs / penguins-recovery

| Event | Action |
|---|---|
| `pif upgrade` (pre) | Calls `penguins-recovery snapshot create pre-pif-upgrade` before the atomic update |
| `pif upgrade` (post) | Notifies penguins-eggs via `eggs pif-upgraded` hook so the next ISO reflects the new root |
| `pif mutable enter` | Warns eggs that the system is temporarily mutable (ISO builds should be deferred) |
| `pif mutable exit` | Triggers `eggs produce --update-root` (if configured) to snapshot the new immutable state |
| `pif rollback` | Calls `penguins-recovery snapshot create pre-pif-rollback` before reverting |

Configure in `pif.toml`:

```toml
[hooks]
eggs_bin     = "/usr/bin/eggs"           # set to "" to disable
recovery_bin = "/usr/bin/penguins-recovery"

pre_upgrade_snapshot  = true   # recovery snapshot before upgrade
post_upgrade_notify   = true   # notify eggs after upgrade
mutable_warn_eggs     = true   # warn eggs on mutable enter
post_mutable_produce  = false  # set true to auto-produce ISO after mutable exit
pre_rollback_snapshot = true   # recovery snapshot before rollback
```

### penguins-eggs / penguins-recovery → penguins-immutable-framework

PIF registers itself as a plugin for both tools:

**eggs plugin** (`integration/eggs-plugin/pif-hook.sh`):
- Called by `eggs produce` to embed the PIF config and backend state into the ISO
- Called by `eggs update` to check whether the system is in mutable mode before updating

**recovery plugin** (`integration/recovery-plugin/pif-plugin.sh`):
- `pw_plugin_pre_reset()` — exits mutable mode if active before a factory reset
- `pw_plugin_post_reset()` — re-initialises the PIF backend after a hard reset

---

## Integrated Backends

| Backend | Mechanism | Best For |
|---|---|---|
| `abroot` | A/B partition swap + OCI images | Appliance/desktop, atomic OCI-based updates |
| `ashos` | BTRFS snapshot tree | Multi-distro, hierarchical snapshot management |
| `frzr` | Read-only BTRFS subvolume deploy | Gaming/appliance, image-based deployment |
| `akshara` | YAML-declared system rebuild | Declarative, container-native distros |
| `btrfs-dwarfs` | BTRFS+DwarFS hybrid blend layer | Storage-constrained, high-compression roots |

---

## Quick Start

```bash
# Install PIF
curl -fsSL https://pif.example.org/install.sh | sh

# Initialise with the abroot backend
pif init --distro ubuntu --backend abroot --arch x86_64

# Upgrade (backend-transparent)
pif upgrade

# Roll back
pif rollback

# Toggle mutability for a one-off change
pif mutable enter
# ... make changes ...
pif mutable exit
```

---

## Configuration (`pif.toml`)

```toml
[pif]
distro  = "arch"
arch    = "x86_64"
backend = "ashos"

[backend.ashos]
snapshot_root  = "/@"
deploy_on_boot = true

[hooks]
eggs_bin              = "/usr/bin/eggs"
recovery_bin          = "/usr/bin/penguins-recovery"
pre_upgrade_snapshot  = true
post_upgrade_notify   = true
mutable_warn_eggs     = true
post_mutable_produce  = false
pre_rollback_snapshot = true
```

---

## License

Each integrated backend retains its original license. PIF framework code
(`core/`, `tools/`, `scripts/`) is licensed under **GPL-3.0**.

## Upstream

Forked from [Interested-Deving-1896/immutable-linux-framework](https://github.com/Interested-Deving-1896/immutable-linux-framework).
