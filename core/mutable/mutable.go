// Package mutable provides the immutability toggle primitive.
//
// This absorbs the logic from blend-os/nearly (chattr +i / overlayfs toggle)
// and generalises it so any backend can delegate to it, or backends can
// provide their own MutableEnter implementation via the HAL.
package mutable

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// Method describes how immutability is enforced on this system.
type Method int

const (
	// MethodChattr uses chattr +i / -i on the root filesystem.
	// Derived from blend-os/nearly's core/chattr.go approach.
	MethodChattr Method = iota

	// MethodOverlayFS mounts an overlayfs with a tmpfs upper layer,
	// making the lower (immutable) layer appear writable.
	MethodOverlayFS

	// MethodBind remounts the root bind-mount as rw/ro.
	MethodBind
)

// Toggle manages the immutability state of a filesystem path.
type Toggle struct {
	root   string
	method Method
}

// New creates a Toggle for the given root path.
// method is auto-detected if MethodBind is passed and the fs supports it.
func New(root string, method Method) *Toggle {
	return &Toggle{root: root, method: method}
}

// Enter makes root temporarily writable.
// Returns a restore function that must be called to re-apply immutability.
func (t *Toggle) Enter() (restore func() error, err error) {
	switch t.method {
	case MethodChattr:
		return t.enterChattr()
	case MethodOverlayFS:
		return t.enterOverlay()
	case MethodBind:
		return t.enterBind()
	default:
		return nil, fmt.Errorf("mutable: unknown method %d", t.method)
	}
}

// IsMutable reports whether root is currently writable.
func (t *Toggle) IsMutable() bool {
	// Try writing a temp file; if it succeeds the fs is writable.
	f, err := os.CreateTemp(t.root, ".ilf-mutable-check-*")
	if err != nil {
		return false
	}
	f.Close()
	os.Remove(f.Name())
	return true
}

// enterChattr uses chattr -i to remove the immutable flag, and restores it
// with chattr +i. This mirrors the approach in blend-os/nearly.
func (t *Toggle) enterChattr() (func() error, error) {
	if err := chattr(t.root, false); err != nil {
		return nil, fmt.Errorf("mutable enter (chattr): %w", err)
	}
	return func() error {
		return chattr(t.root, true)
	}, nil
}

// enterOverlay mounts a tmpfs-backed overlayfs over root.
func (t *Toggle) enterOverlay() (func() error, error) {
	upper := t.root + "/.ilf-overlay-upper"
	work := t.root + "/.ilf-overlay-work"
	merged := t.root + "/.ilf-overlay-merged"

	for _, d := range []string{upper, work, merged} {
		if err := os.MkdirAll(d, 0o755); err != nil {
			return nil, err
		}
	}

	opts := fmt.Sprintf("lowerdir=%s,upperdir=%s,workdir=%s", t.root, upper, work)
	cmd := exec.Command("mount", "-t", "overlay", "overlay", "-o", opts, merged)
	if out, err := cmd.CombinedOutput(); err != nil {
		return nil, fmt.Errorf("mutable overlay mount: %s: %w", strings.TrimSpace(string(out)), err)
	}

	return func() error {
		if err := exec.Command("umount", merged).Run(); err != nil {
			return fmt.Errorf("mutable overlay umount: %w", err)
		}
		for _, d := range []string{merged, work, upper} {
			os.RemoveAll(d)
		}
		return nil
	}, nil
}

// enterBind remounts the root as rw.
func (t *Toggle) enterBind() (func() error, error) {
	if err := remount(t.root, "rw"); err != nil {
		return nil, fmt.Errorf("mutable bind enter: %w", err)
	}
	return func() error {
		return remount(t.root, "ro")
	}, nil
}

func chattr(path string, immutable bool) error {
	flag := "+i"
	if !immutable {
		flag = "-i"
	}
	cmd := exec.Command("chattr", "-R", flag, path)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("chattr %s %s: %s: %w", flag, path, strings.TrimSpace(string(out)), err)
	}
	return nil
}

func remount(path, mode string) error {
	cmd := exec.Command("mount", "-o", "remount,"+mode, path)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("remount %s %s: %s: %w", mode, path, strings.TrimSpace(string(out)), err)
	}
	return nil
}
