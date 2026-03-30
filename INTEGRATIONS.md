# penguins-immutable-framework integrations

External projects and ecosystem tools integrated into penguins-immutable-framework (PIF).

## penguins ecosystem (bidirectional)

| Direction | Tool | Hook point | Action |
|---|---|---|---|
| pif → recovery | [penguins-recovery](https://github.com/Interested-Deving-1896/penguins-recovery) | Pre-upgrade | `penguins-recovery snapshot create pre-pif-upgrade-<backend>` |
| pif → eggs | [penguins-eggs](https://github.com/Interested-Deving-1896/penguins-eggs) | Post-upgrade | Notifies eggs via `EGGS_HOOK=pif-upgraded` so next ISO reflects new root |
| pif → eggs | penguins-eggs | `pif mutable enter` | Warns eggs to defer ISO builds (`EGGS_HOOK=pif-mutable-enter`) |
| pif → eggs | penguins-eggs | `pif mutable exit` | Notifies eggs immutability restored; optionally triggers `eggs produce --update-root` |
| pif → recovery | penguins-recovery | Pre-rollback | `penguins-recovery snapshot create pre-pif-rollback-<id>` |
| eggs → pif | penguins-eggs | `eggs produce` | Embeds active `pif.toml` + `pif status --json` into ISO at `/etc/penguins-immutable-framework/` |
| eggs → pif | penguins-eggs | `eggs update` | Aborts if system is in mutable mode |
| powerwash → pif | [penguins-powerwash](https://github.com/Interested-Deving-1896/penguins-powerwash) | Pre-reset | Exits mutable mode before factory reset |
| powerwash → pif | penguins-powerwash | Post-reset | Re-runs `pif init` with existing `pif.toml` to restore immutable backend |

### Integration files

| File | Purpose |
|---|---|
| `core/hooks/hooks.go` | Go `Runner` type — all outbound hook calls |
| `core/config/config.go` | `HooksRunner()` — constructs Runner from `[hooks]` in `pif.toml` |
| `integration/eggs-plugin/pif-hook.sh` | Called by `eggs produce` / `eggs update` and by pif Go hooks |
| `integration/recovery-plugin/pif-plugin.sh` | Registered as a penguins-powerwash distro plugin |

### Configuration (`pif.toml`)

```toml
[hooks]
eggs_bin              = "/usr/bin/eggs"
recovery_bin          = "/usr/bin/penguins-recovery"
pre_upgrade_snapshot  = true   # recovery snapshot before upgrade
post_upgrade_notify   = true   # notify eggs after upgrade
mutable_warn_eggs     = true   # warn eggs on mutable enter
post_mutable_produce  = false  # auto-produce ISO after mutable exit (slow)
pre_rollback_snapshot = true   # recovery snapshot before rollback
```

### Registration

```bash
# Register eggs plugin
sudo ln -sf /usr/share/penguins-immutable-framework/integration/eggs-plugin/pif-hook.sh \
            /usr/share/penguins-eggs/plugins/pif-hook.sh

# Register powerwash plugin
sudo ln -sf /usr/share/penguins-immutable-framework/integration/recovery-plugin/pif-plugin.sh \
            /usr/share/penguins-powerwash/plugins/distro/pif-plugin.sh

# Or use the Makefile target (handles both):
sudo make install-integration
```

---

## Immutability backends

| Backend | Upstream | Mechanism | Best for |
|---|---|---|---|
| `abroot` | [Vanilla OS / ABRoot](https://github.com/Vanilla-OS/ABRoot) | A/B partition swap + OCI images | Appliance/desktop, atomic OCI-based updates |
| `ashos` | [ashos/ashos](https://github.com/ashos/ashos) | BTRFS snapshot tree | Multi-distro, hierarchical snapshot management |
| `frzr` | [frzr/frzr](https://github.com/frzr/frzr) | Read-only BTRFS subvolume deploy | Gaming/appliance, image-based deployment |
| `akshara` | [helloSystem/Akshara](https://github.com/helloSystem/Akshara) | YAML-declared system rebuild | Declarative, container-native distros |
| `btrfs-dwarfs` | [mhx/dwarfs](https://github.com/mhx/dwarfs) + btrfs | BTRFS + DwarFS hybrid blend layer | Storage-constrained, high-compression roots |

Each backend implements the `hal.Backend` interface (`core/hal/hal.go`).

---

## HAL interface summary

```go
type Backend interface {
    Name() string
    Init(cfg map[string]any) error
    Upgrade(opts UpgradeOptions) error
    Rollback(snapshotID string) error
    Status() (*Status, error)
    MutableEnter() (func() error, error)
    MutableExit() error
    Capabilities() Capability
}
```

The `Mutable` field in `Status` is always overridden by `mutable.LockExists()`
in the CLI layer — backends do not need to track this themselves.

---

## Snapshot storage

Snapshots are managed by `core/snapshot/Manager` on top of the HAL. The
`PreRollback` hook fires before every rollback, creating a penguins-recovery
snapshot so the user can recover if the rollback itself fails.
