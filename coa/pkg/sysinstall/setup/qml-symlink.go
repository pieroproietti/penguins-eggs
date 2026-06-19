package setup

import (
	"fmt"
	"os"
	"path/filepath"
)

func QmlSymlink() error {
	qmlDir := filepath.Join(InstallerDRoot, "qml")
	source := "/usr/share/calamares/qml/calamares"
	targetLink := filepath.Join(qmlDir, "calamares")

	if _, err := os.Stat(source); os.IsNotExist(err) {
		return fmt.Errorf("QML source not found: %s", source)
	}

	os.RemoveAll(targetLink)

	if err := os.Symlink(source, targetLink); err != nil {
		return fmt.Errorf("symlink failed %s -> %s: %w", source, targetLink, err)
	}

	return nil
}
