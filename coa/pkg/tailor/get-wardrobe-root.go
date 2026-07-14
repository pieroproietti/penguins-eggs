package tailor

import (
	"fmt"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"strings"
)

func getWardrobeRoot() (string, error) {
	// 1. sudo: SUDO_USER identifica al usuario real detrás de la elevación.
	if sudoUser := os.Getenv("SUDO_USER"); sudoUser != "" {
		if u, err := user.Lookup(sudoUser); err == nil {
			return filepath.Join(u.HomeDir, ".oa-wardrobe"), nil
		}
	}

	// 2. Distros sin sudo (Quirinux entre otras, que usan 'su' o similar)
	// no setean SUDO_USER, y $HOME bajo 'su' suele quedar en /root -- ahí
	// es donde 'coa wardrobe wear' terminaba escribiendo/leyendo por error.
	// 'logname' consulta el loginuid de auditoría del kernel, que identifica
	// a quien inició sesión originalmente sin importar cuántos 'su' haya
	// en el medio.
	if out, err := exec.Command("logname").Output(); err == nil {
		login := strings.TrimSpace(string(out))
		if login != "" && login != "root" {
			if u, err := user.Lookup(login); err == nil {
				return filepath.Join(u.HomeDir, ".oa-wardrobe"), nil
			}
		}
	}

	// 3. Último recurso: HOME del proceso actual (caso normal, sin elevar
	// privilegios en absoluto).
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("unable to determine home directory: %v", err)
	}
	return filepath.Join(home, ".oa-wardrobe"), nil
}
