package setup

import "path/filepath"

func shellprocessBootloaderBridge() error {
	target := filepath.Join(InstallerDRoot, "modules", "shellprocess_bootloader-bridge.conf")
	return renderAndSaveEmbedded("shellprocess_bootloader-bridge.conf.tmpl", target, nil, 0644)
}
