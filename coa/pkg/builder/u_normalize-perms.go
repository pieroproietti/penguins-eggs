package builder

import (
	"coa/pkg/utils"
	"os"
	"path/filepath"
)

// normalizePerms forces standard, umask-independent permissions (0755 dirs
// and executables, 0644 everything else) on the whole stage tree, since
// MkdirAll/OpenFile apply the caller's umask. A chmod failure is logged and
// skipped rather than aborting filepath.Walk's whole traversal.
func normalizePerms(root string) error {
	return filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			utils.LogWarning("normalizePerms: %s: %v", path, err)
			return nil
		}
		if info.Mode()&os.ModeSymlink != 0 {
			return nil
		}
		mode := os.FileMode(0644)
		if info.IsDir() || info.Mode()&0100 != 0 {
			mode = 0755
		}
		if err := os.Chmod(path, mode); err != nil {
			utils.LogWarning("normalizePerms: chmod %s: %v", path, err)
		}
		return nil
	})
}
