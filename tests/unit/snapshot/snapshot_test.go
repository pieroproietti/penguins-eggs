package snapshot_test

import (
	"testing"

	"github.com/penguins-immutable-framework/core/hal"
	"github.com/penguins-immutable-framework/core/snapshot"
)

// snapshotStub is a Backend whose Status returns a fixed snapshot list.
type snapshotStub struct {
	snaps []hal.SnapshotInfo
}

func (s *snapshotStub) Name() string { return "snapshot-stub" }
func (s *snapshotStub) Capabilities() hal.Capability {
	return hal.CapSnapshot | hal.CapRollback
}
func (s *snapshotStub) Init(cfg map[string]string) error      { return nil }
func (s *snapshotStub) Upgrade(opts hal.UpgradeOptions) error { return nil }
func (s *snapshotStub) Rollback(id string) error              { return nil }
func (s *snapshotStub) Snapshot(name string) (string, error)  { return "new-snap", nil }
func (s *snapshotStub) DeleteSnapshot(id string) error        { return nil }
func (s *snapshotStub) Deploy(id string) error                { return nil }
func (s *snapshotStub) MutableEnter() (func() error, error) {
	return func() error { return nil }, nil
}
func (s *snapshotStub) PkgAdd(pkgs []string) error    { return nil }
func (s *snapshotStub) PkgRemove(pkgs []string) error { return nil }
func (s *snapshotStub) Status() (*hal.Status, error) {
	return &hal.Status{
		Backend:   s.Name(),
		Snapshots: s.snaps,
	}, nil
}

func TestList_ReturnsAllSnapshots(t *testing.T) {
	stub := &snapshotStub{
		snaps: []hal.SnapshotInfo{
			{ID: "1", Name: "pre-upgrade-20240101T120000Z", Deployed: false},
			{ID: "2", Name: "pre-upgrade-20240102T120000Z", Deployed: true},
		},
	}
	mgr := snapshot.New(stub, 5)

	snaps, err := mgr.List()
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(snaps) != 2 {
		t.Fatalf("List: got %d snapshots, want 2", len(snaps))
	}
	if snaps[0].ID != "1" || snaps[1].ID != "2" {
		t.Errorf("List: unexpected IDs: %v", snaps)
	}
}

func TestList_Empty(t *testing.T) {
	stub := &snapshotStub{snaps: nil}
	mgr := snapshot.New(stub, 5)

	snaps, err := mgr.List()
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(snaps) != 0 {
		t.Errorf("List: expected empty, got %v", snaps)
	}
}

func TestList_DeployedFlagPreserved(t *testing.T) {
	stub := &snapshotStub{
		snaps: []hal.SnapshotInfo{
			{ID: "10", Deployed: false},
			{ID: "11", Deployed: true},
		},
	}
	mgr := snapshot.New(stub, 5)

	snaps, err := mgr.List()
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	for _, s := range snaps {
		if s.ID == "11" && !s.Deployed {
			t.Errorf("snapshot 11 should be marked deployed")
		}
		if s.ID == "10" && s.Deployed {
			t.Errorf("snapshot 10 should not be marked deployed")
		}
	}
}

func TestRollback_CallsBackend(t *testing.T) {
	called := false
	stub := &rollbackStub{onRollback: func(id string) error {
		called = true
		return nil
	}}
	mgr := snapshot.New(stub, 5)

	if err := mgr.Rollback(""); err != nil {
		t.Fatalf("Rollback: %v", err)
	}
	if !called {
		t.Error("expected backend Rollback to be called")
	}
}

// rollbackStub lets us verify Rollback is delegated correctly.
type rollbackStub struct {
	snapshotStub
	onRollback func(string) error
}

func (r *rollbackStub) Rollback(id string) error { return r.onRollback(id) }
func (r *rollbackStub) Capabilities() hal.Capability {
	return hal.CapSnapshot | hal.CapRollback
}
