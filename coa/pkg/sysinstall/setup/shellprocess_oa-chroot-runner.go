package setup

import "path/filepath"

func shellprocessOaChrootRunner() error {
	target := filepath.Join(InstallerDRoot, "modules", "shellprocess_krill-chroot-runner.conf")
	return renderAndSaveEmbedded("shellprocess_krill-chroot-runner.conf.tmpl", target, nil, 0644)
}
