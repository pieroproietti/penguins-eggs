package hal_test

import (
	"testing"

	"github.com/ilf/core/hal"
)

// stubBackend is a minimal Backend for testing HAL registration and dispatch.
type stubBackend struct {
	name string
	caps hal.Capability
}

func (s *stubBackend) Name() string                          { return s.name }
func (s *stubBackend) Capabilities() hal.Capability          { return s.caps }
func (s *stubBackend) Init(cfg map[string]string) error      { return nil }
func (s *stubBackend) Upgrade(opts hal.UpgradeOptions) error { return nil }
func (s *stubBackend) Rollback(id string) error              { return nil }
func (s *stubBackend) Snapshot(name string) (string, error)  { return "snap-1", nil }
func (s *stubBackend) DeleteSnapshot(id string) error        { return nil }
func (s *stubBackend) Deploy(id string) error                { return nil }
func (s *stubBackend) Status() (*hal.Status, error)          { return &hal.Status{Backend: s.name}, nil }
func (s *stubBackend) MutableEnter() (func() error, error)   { return func() error { return nil }, nil }
func (s *stubBackend) PkgAdd(pkgs []string) error            { return nil }
func (s *stubBackend) PkgRemove(pkgs []string) error         { return nil }

func TestRegisterAndGet(t *testing.T) {
	b := &stubBackend{name: "test-stub", caps: hal.CapSnapshot | hal.CapRollback}
	hal.Register(b)

	got, err := hal.Get("test-stub")
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if got.Name() != "test-stub" {
		t.Errorf("Name: got %q, want %q", got.Name(), "test-stub")
	}
}

func TestGetUnknown(t *testing.T) {
	_, err := hal.Get("does-not-exist")
	if err == nil {
		t.Fatal("expected error for unknown backend, got nil")
	}
}

func TestHasCapability(t *testing.T) {
	b := &stubBackend{name: "cap-stub", caps: hal.CapSnapshot | hal.CapRollback}
	hal.Register(b)

	if !hal.Has(b, hal.CapSnapshot) {
		t.Error("expected CapSnapshot to be set")
	}
	if !hal.Has(b, hal.CapRollback) {
		t.Error("expected CapRollback to be set")
	}
	if hal.Has(b, hal.CapOCIImages) {
		t.Error("expected CapOCIImages to be unset")
	}
}

func TestRegistered(t *testing.T) {
	// At least the two stubs registered above should appear.
	names := hal.Registered()
	found := false
	for _, n := range names {
		if n == "test-stub" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("Registered() did not include test-stub; got %v", names)
	}
}
