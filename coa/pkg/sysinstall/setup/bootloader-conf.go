package setup

import "path/filepath"

func bootloaderConf() error {
	target := filepath.Join(InstallerDRoot, "modules", "shellprocess_oa_bootloader.conf")
	return renderAndSaveEmbedded("shellprocess.conf.tmpl", target, nil, 0644)
}
