package builder

import (
	"os"
	"path/filepath"
)

// normalizePerms forces standard, umask-independent permissions on the whole
// stage tree (0755 dirs, 0755 executables, 0644 other files) right before
// packaging. os.MkdirAll/OpenFile apply the caller's umask, so a restrictive
// umask (e.g. 027) silently ships root-only binaries and dirs; owner bits are
// never masked by a conventional umask, so info.Mode()&0100 still reliably
// tells executables apart from plain files.
func normalizePerms(root string) error {
	return filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.Mode()&os.ModeSymlink != 0 {
			return err
		}
		if info.IsDir() {
			return os.Chmod(path, 0755)
		}
		if info.Mode()&0100 != 0 {
			return os.Chmod(path, 0755)
		}
		return os.Chmod(path, 0644)
	})
}
