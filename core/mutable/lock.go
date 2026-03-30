package mutable

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

const lockPath = "/run/ilf-mutable.lock"

// lockFile is the on-disk representation of an active mutable session.
type lockFile struct {
	Root   string `json:"root"`
	Method int    `json:"method"`
	PID    int    `json:"pid"`
}

// writeLock persists the active mutable session so that a subsequent
// `ilf mutable exit` process can read it and call the correct restore path.
func writeLock(root string, method Method) error {
	if err := os.MkdirAll(filepath.Dir(lockPath), 0o755); err != nil {
		return fmt.Errorf("mutable lock: mkdir: %w", err)
	}
	data, err := json.Marshal(lockFile{
		Root:   root,
		Method: int(method),
		PID:    os.Getpid(),
	})
	if err != nil {
		return err
	}
	return os.WriteFile(lockPath, data, 0o600)
}

// readLock reads the active mutable session from disk.
// Returns an error if no session is active.
func readLock() (*lockFile, error) {
	data, err := os.ReadFile(lockPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("mutable: no active session (run 'ilf mutable enter' first)")
		}
		return nil, fmt.Errorf("mutable lock read: %w", err)
	}
	var lf lockFile
	if err := json.Unmarshal(data, &lf); err != nil {
		return nil, fmt.Errorf("mutable lock parse: %w", err)
	}
	return &lf, nil
}

// clearLock removes the lock file after a successful restore.
func clearLock() error {
	if err := os.Remove(lockPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("mutable lock clear: %w", err)
	}
	return nil
}

// LockExists reports whether a mutable session is currently active.
func LockExists() bool {
	_, err := os.Stat(lockPath)
	return err == nil
}
