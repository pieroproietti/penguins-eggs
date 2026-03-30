// Package snapshot provides backend-agnostic snapshot lifecycle management.
// It wraps the HAL Backend interface and adds pruning, naming conventions,
// and a consistent audit log.
package snapshot

import (
	"fmt"
	"time"

	"github.com/ilf/core/hal"
)

// Manager orchestrates snapshot operations on top of a HAL backend.
type Manager struct {
	backend hal.Backend
	maxKeep int
}

// New creates a Manager for the given backend.
// maxKeep is the maximum number of snapshots to retain; 0 means unlimited.
func New(b hal.Backend, maxKeep int) *Manager {
	return &Manager{backend: b, maxKeep: maxKeep}
}

// Create takes a snapshot named after the current timestamp, optionally
// prefixed with label. Returns the backend-assigned snapshot ID.
func (m *Manager) Create(label string) (string, error) {
	if !hal.Has(m.backend, hal.CapSnapshot) {
		return "", hal.ErrNotSupported
	}
	name := buildName(label)
	id, err := m.backend.Snapshot(name)
	if err != nil {
		return "", fmt.Errorf("snapshot create: %w", err)
	}
	if m.maxKeep > 0 {
		if err := m.prune(); err != nil {
			// Non-fatal: log but don't fail the create.
			fmt.Printf("snapshot prune warning: %v\n", err)
		}
	}
	return id, nil
}

// List returns all snapshots from the backend.
func (m *Manager) List() ([]hal.SnapshotInfo, error) {
	st, err := m.backend.Status()
	if err != nil {
		return nil, err
	}
	return st.Snapshots, nil
}

// Deploy makes snapshotID the next boot target.
func (m *Manager) Deploy(snapshotID string) error {
	return m.backend.Deploy(snapshotID)
}

// Delete removes a snapshot by ID.
func (m *Manager) Delete(id string) error {
	if !hal.Has(m.backend, hal.CapSnapshot) {
		return hal.ErrNotSupported
	}
	return m.backend.DeleteSnapshot(id)
}

// Rollback reverts to the previous state (or a specific snapshot).
func (m *Manager) Rollback(snapshotID string) error {
	if !hal.Has(m.backend, hal.CapRollback) {
		return hal.ErrNotSupported
	}
	return m.backend.Rollback(snapshotID)
}

// prune deletes the oldest snapshots beyond m.maxKeep.
func (m *Manager) prune() error {
	snaps, err := m.List()
	if err != nil {
		return err
	}
	// Keep deployed snapshots; only prune non-deployed ones.
	var candidates []hal.SnapshotInfo
	for _, s := range snaps {
		if !s.Deployed {
			candidates = append(candidates, s)
		}
	}
	excess := len(candidates) - m.maxKeep
	for i := 0; i < excess; i++ {
		if err := m.Delete(candidates[i].ID); err != nil {
			return fmt.Errorf("prune %s: %w", candidates[i].ID, err)
		}
	}
	return nil
}

func buildName(label string) string {
	ts := time.Now().UTC().Format("20060102T150405Z")
	if label == "" {
		return ts
	}
	return label + "-" + ts
}
