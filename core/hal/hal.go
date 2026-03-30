// Package hal defines the Backend interface that every immutability backend
// must implement, and the registry that maps backend names to implementations.
//
// All ILF operations (upgrade, rollback, snapshot, etc.) are dispatched
// through this interface so the rest of the framework stays backend-agnostic.
package hal

import (
	"fmt"
	"sync"
)

// Capability flags let the framework know which optional operations a backend
// supports without requiring every backend to implement every method.
type Capability uint32

const (
	CapSnapshot      Capability = 1 << iota // create/list/delete named snapshots
	CapRollback                             // revert to a previous state
	CapAtomicPkg                            // atomic package install inside a transaction
	CapOCIImages                            // pull and apply OCI container images
	CapMutable                              // toggle read-write mode at runtime
	CapCompression                          // backend-native compression (e.g. DwarFS)
	CapMultiBoot                            // manage multiple bootable entries
	CapThinProvision                        // LVM thin provisioning support
)

// Status is returned by Backend.Status().
type Status struct {
	Backend     string
	CurrentRoot string // e.g. "A", "snapshot-3", "subvol-@.20250101"
	Mutable     bool
	Snapshots   []SnapshotInfo
	Extra       map[string]string // backend-specific key/value pairs
}

// SnapshotInfo describes a single snapshot entry.
type SnapshotInfo struct {
	ID        string
	Name      string
	Timestamp string
	Deployed  bool
	Parent    string // empty for root snapshots
}

// UpgradeOptions carries parameters for an upgrade operation.
type UpgradeOptions struct {
	// DryRun reports what would change without applying it.
	DryRun bool
	// Force skips pre-flight checks.
	Force bool
	// Packages is a list of packages to install/upgrade (backend-dependent).
	Packages []string
}

// Backend is the contract every immutability backend must satisfy.
// Methods that are not supported by a backend should return ErrNotSupported.
type Backend interface {
	// Name returns the canonical backend identifier (e.g. "abroot").
	Name() string

	// Capabilities returns the set of optional features this backend supports.
	Capabilities() Capability

	// Init sets up the backend for first use on this system.
	// Called once during `ilf init`.
	Init(cfg map[string]string) error

	// Upgrade performs an atomic system upgrade.
	Upgrade(opts UpgradeOptions) error

	// Rollback reverts the system to the previous state.
	// snapshotID is optional; if empty the backend chooses the previous state.
	Rollback(snapshotID string) error

	// Snapshot creates a named snapshot of the current root.
	// Returns the snapshot ID assigned by the backend.
	Snapshot(name string) (string, error)

	// DeleteSnapshot removes a snapshot by ID.
	DeleteSnapshot(id string) error

	// Deploy makes a snapshot the next boot target.
	Deploy(snapshotID string) error

	// Status returns the current system state.
	Status() (*Status, error)

	// MutableEnter makes the root filesystem temporarily writable.
	// Returns a cleanup function that restores immutability.
	MutableEnter() (func() error, error)

	// PkgAdd installs packages inside an atomic transaction.
	PkgAdd(packages []string) error

	// PkgRemove removes packages inside an atomic transaction.
	PkgRemove(packages []string) error
}

// ErrNotSupported is returned when a backend does not implement an operation.
var ErrNotSupported = fmt.Errorf("operation not supported by this backend")

// registry holds all registered backends.
var (
	mu       sync.RWMutex
	registry = map[string]Backend{}
)

// Register adds a backend to the global registry.
// Panics if a backend with the same name is already registered.
func Register(b Backend) {
	mu.Lock()
	defer mu.Unlock()
	if _, exists := registry[b.Name()]; exists {
		panic(fmt.Sprintf("hal: backend %q already registered", b.Name()))
	}
	registry[b.Name()] = b
}

// Get returns the backend registered under name, or an error if not found.
func Get(name string) (Backend, error) {
	mu.RLock()
	defer mu.RUnlock()
	b, ok := registry[name]
	if !ok {
		return nil, fmt.Errorf("hal: unknown backend %q (registered: %v)", name, Registered())
	}
	return b, nil
}

// Registered returns the names of all registered backends.
func Registered() []string {
	mu.RLock()
	defer mu.RUnlock()
	names := make([]string, 0, len(registry))
	for n := range registry {
		names = append(names, n)
	}
	return names
}

// Has reports whether a backend supports a given capability.
func Has(b Backend, cap Capability) bool {
	return b.Capabilities()&cap != 0
}
