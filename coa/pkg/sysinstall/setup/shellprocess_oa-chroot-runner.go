/*
 * penguins-eggs - Copyright (C) 2017-2026 Piero Proietti
 * Author: Piero Proietti <piero.proietti@gmail.com>
 * https://penguins-eggs.net
 *
 * This file is part of penguins-eggs.
 * Released under the GNU GPL v3 license.
 */

package setup

import "path/filepath"

func shellprocessOaChrootRunner() error {
	target := filepath.Join(InstallerDRoot, "modules", "shellprocess_krill-chroot-runner.conf")
	return renderAndSaveEmbedded("shellprocess_krill-chroot-runner.conf.tmpl", target, nil, 0644)
}
