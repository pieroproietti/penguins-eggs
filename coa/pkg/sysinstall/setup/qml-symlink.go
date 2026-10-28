/*
 * penguins-eggs - Copyright (C) 2017-2026 Piero Proietti
 * Author: Piero Proietti <piero.proietti@gmail.com>
 * https://penguins-eggs.net
 *
 * This file is part of penguins-eggs.
 * Released under the GNU GPL v3 license.
 */

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
