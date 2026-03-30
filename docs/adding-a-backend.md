# Adding a New Backend

A backend is a Go package in `backends/<name>/` that implements `hal.Backend`
and registers itself via `init()`.

## Minimum contract

```go
package mybackend

import "github.com/ilf/core/hal"

func init() { hal.Register(&Backend{}) }

type Backend struct{ cfg map[string]string }

func (b *Backend) Name() string              { return "mybackend" }
func (b *Backend) Capabilities() hal.Capability { return hal.CapRollback }

func (b *Backend) Init(cfg map[string]string) error { b.cfg = cfg; return nil }
func (b *Backend) Upgrade(opts hal.UpgradeOptions) error { /* ... */ }
func (b *Backend) Rollback(id string) error              { /* ... */ }
func (b *Backend) Status() (*hal.Status, error)          { /* ... */ }

// Unsupported operations return hal.ErrNotSupported
func (b *Backend) Snapshot(name string) (string, error) { return "", hal.ErrNotSupported }
func (b *Backend) DeleteSnapshot(id string) error        { return hal.ErrNotSupported }
func (b *Backend) Deploy(id string) error                { return hal.ErrNotSupported }
func (b *Backend) MutableEnter() (func() error, error)  { return nil, hal.ErrNotSupported }
func (b *Backend) PkgAdd(pkgs []string) error            { return hal.ErrNotSupported }
func (b *Backend) PkgRemove(pkgs []string) error         { return hal.ErrNotSupported }
```

## Steps

1. Create `backends/<name>/adapter.go` implementing `hal.Backend`.
2. Add a blank import in `tools/ilf/main.go`:
   ```go
   _ "github.com/ilf/backends/mybackend"
   ```
3. Add a distro profile in `distros/<distro>.toml` listing `"mybackend"` in
   the `backends` array.
4. Add a `[backend.mybackend]` section to `ilf.toml.sample` documenting the
   config keys your backend reads from `cfg`.
5. Document the backend in `docs/backends.md`.
6. Add integration tests in `tests/integration/`.

## Capability flags

Declare only the capabilities your backend genuinely supports. The framework
checks `hal.Has(b, cap)` before calling optional methods.

| Flag | Meaning |
|---|---|
| `CapSnapshot` | `Snapshot()`, `DeleteSnapshot()`, `Deploy()` work |
| `CapRollback` | `Rollback()` works |
| `CapAtomicPkg` | `PkgAdd()` / `PkgRemove()` work |
| `CapOCIImages` | Backend pulls OCI images from a registry |
| `CapMutable` | `MutableEnter()` works |
| `CapCompression` | Backend applies native compression to stored data |
| `CapMultiBoot` | Backend can manage multiple bootable entries |
| `CapThinProvision` | Backend supports LVM thin provisioning |

## Config keys

Your backend receives a `map[string]string` from the `[backend.<name>]` section
of `ilf.toml`. Use the `get(cfg, key, default)` helper pattern to read values
with safe defaults.
