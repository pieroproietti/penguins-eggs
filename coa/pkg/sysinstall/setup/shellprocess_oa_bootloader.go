package setup

import "path/filepath"

func shellprocessOaBootloader() error {
	target := filepath.Join(InstallerDRoot, "modules", "shellprocess_oa_bootloader.conf")
	return renderAndSaveEmbedded("shellprocess_oa_bootloader.tmpl", target, nil, 0644)
}
