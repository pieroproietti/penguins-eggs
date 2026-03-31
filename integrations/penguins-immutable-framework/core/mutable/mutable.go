// Package mutable provides the immutability toggle primitive.
// Call Toggle.SetHooks to enable penguins-eggs / penguins-recovery notifications.
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

	"github.com/penguins-immutable-framework/core/hooks"
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
	hooks  *hooks.Runner // nil = no ecosystem notifications
}

// SetHooks attaches a hooks.Runner so Enter/Exit notify penguins-eggs and
// penguins-recovery. Call before Enter().
func (t *Toggle) SetHooks(r *hooks.Runner) {
	t.hooks = r
}

// New creates a Toggle for the given root path.
// method is auto-detected if MethodBind is passed and the fs supports it.
func New(root string, method Method) *Toggle {
	return &Toggle{root: root, method: method}
}

// Enter makes root temporarily writable.
// Writes a lock file to lockPath so that Exit() can restore immutability
// even from a separate process invocation.
// Returns a restore function for in-process use; callers that span processes
// should use the package-level Exit() instead.
func (t *Toggle) Enter() (restore func() error, err error) {
	if LockExists() {
		return nil, fmt.Errorf("mutable: session already active (run 'pif mutable exit' first)")
	}

	// Warn penguins-eggs that the system is temporarily writable
	t.hooks.MutableEnter()

	var fn func() error
	switch t.method {
	case MethodChattr:
		fn, err = t.enterChattr()
	case MethodOverlayFS:
		fn, err = t.enterOverlay()
	case MethodBind:
		fn, err = t.enterBind()
	default:
		return nil, fmt.Errorf("mutable: unknown method %d", t.method)
	}
	if err != nil {
		return nil, err
	}

	if err := writeLock(t.root, t.method); err != nil {
		// Best-effort: restore immediately if we can't persist the lock.
		_ = fn()
		return nil, err
	}

	return func() error {
		defer func() {
			if err := clearLock(); err != nil {
				fmt.Fprintf(os.Stderr, "mutable: clear lock: %v\n", err)
			}
			// Notify penguins-eggs that immutability is restored
			t.hooks.MutableExit()
		}()
		return fn()
	}, nil
}

// Exit reads the active lock file and restores immutability.
// This is the cross-process counterpart to the restore closure returned by Enter().
func Exit() error {
	lf, err := readLock()
	if err != nil {
		return err
	}
	t := New(lf.Root, Method(lf.Method))
	defer func() {
		if err := clearLock(); err != nil {
			fmt.Fprintf(os.Stderr, "mutable: clear lock: %v\n", err)
		}
	}()

	switch Method(lf.Method) {
	case MethodChattr:
		return chattr(t.root, true)
	case MethodOverlayFS:
		// Unmount the overlay merged directory.
		merged := t.root + "/.pif-overlay-merged"
		if err := remount(merged, ""); err != nil {
			return fmt.Errorf("mutable exit (overlay umount): %w", err)
		}
		for _, d := range []string{merged,
			t.root + "/.pif-overlay-work",
			t.root + "/.pif-overlay-upper"} {
			// Non-fatal: log but continue cleanup on removal errors.
			if rerr := os.RemoveAll(d); rerr != nil {
				fmt.Fprintf(os.Stderr, "mutable exit: cleanup %s: %v\n", d, rerr)
			}
		}
		return nil
	case MethodBind:
		return remount(t.root, "ro")
	default:
		return fmt.Errorf("mutable exit: unknown method %d in lock file", lf.Method)
	}
}

// IsMutable reports whether root is currently writable.
func (t *Toggle) IsMutable() bool {
	// Try writing a temp file; if it succeeds the fs is writable.
	f, err := os.CreateTemp(t.root, ".pif-mutable-check-*")
	if err != nil {
		return false
	}
	f.Close()
	_ = os.Remove(f.Name()) // best-effort probe cleanup; error is irrelevant
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
	upper := t.root + "/.pif-overlay-upper"
	work := t.root + "/.pif-overlay-work"
	merged := t.root + "/.pif-overlay-merged"

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
