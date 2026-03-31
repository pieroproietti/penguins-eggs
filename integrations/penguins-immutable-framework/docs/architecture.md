# Architecture

## Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                        pif  (CLI)                                   │
│  init │ upgrade │ rollback │ snapshot │ status │ mutable │ pkg      │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  calls
┌───────────────────────────▼─────────────────────────────────────────┐
│                     Core Modules                                    │
│                                                                     │
│  config ──► hal ──► snapshot                                        │
│               │                                                     │
│               ├──► update  (pre-snapshot → upgrade → post-hook)     │
│               └──► mutable (chattr / overlayfs / bind-remount)      │
└──────┬──────┬──────┬──────┬──────┬──────────────────────────────────┘
       │      │      │      │      │  implements hal.Backend
       ▼      ▼      ▼      ▼      ▼
    abroot  ashos  frzr  akshara  btrfs-dwarfs
```

## HAL (Hardware Abstraction Layer)

`core/hal` defines the `Backend` interface. Every backend must implement:

| Method | Description |
|---|---|
| `Init(cfg)` | First-time setup: partition layout, config files, etc. |
| `Upgrade(opts)` | Atomic system upgrade |
| `Rollback(id)` | Revert to previous state or named snapshot |
| `Snapshot(name)` | Create a named snapshot; returns backend-assigned ID |
| `DeleteSnapshot(id)` | Remove a snapshot |
| `Deploy(id)` | Set a snapshot as the next boot target |
| `Status()` | Return current root, snapshot list, mutable state |
| `MutableEnter()` | Make root writable; return a restore closure |
| `PkgAdd(pkgs)` | Install packages inside an atomic transaction |
| `PkgRemove(pkgs)` | Remove packages inside an atomic transaction |

Backends declare optional capabilities via `Capabilities() Capability`. The
framework checks these before calling optional methods, and returns
`hal.ErrNotSupported` for unimplemented operations.

## Config Flow

```
pif.toml
  └─ [pif].backend = "ashos"
       └─ config.BackendConfig("ashos")  →  map[string]string
            └─ Backend.Init(cfg)
```

## Update Flow

```
pif upgrade
  1. config.Load()
  2. hal.Get(backend)
  3. update.Run(backend, opts)
       a. snapshot.Create("pre-upgrade")   ← safety net
       b. runHook(pre_upgrade_hook)
       c. backend.Upgrade(opts)
            └─ on failure: snapshot.Rollback(pre-upgrade-id)
       d. runHook(post_upgrade_hook)
       e. snapshot.Prune()                 ← enforce max_snapshots
```

## Mutable Toggle Hierarchy

When a backend does not implement `MutableEnter()` (returns `ErrNotSupported`),
the CLI falls back to `core/mutable` which provides three methods:

1. **chattr** — `chattr -R -i / && ... && chattr -R +i /`  
   Derived from blend-os/nearly's `core/chattr.go`.
2. **overlayfs** — mount a tmpfs-backed overlayfs over the root.  
   Writes land in tmpfs; discarded on `mutable exit`.
3. **bind** — `mount -o remount,rw /` and `mount -o remount,ro /`.

The method is selected based on what the filesystem supports.

## Snapshot Pruning

`snapshot.Manager` enforces `max_snapshots` from `pif.toml`. After every
`Create()`, it lists all non-deployed snapshots and deletes the oldest ones
until the count is within the limit. Deployed snapshots are never pruned.
