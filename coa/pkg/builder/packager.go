package builder

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// finalPath è il percorso completo dove il pacchetto deve atterrare
func packager(stage, dist string, finalPath string) {
	fmt.Printf("[build] Packager: sigillo il pacchetto per %s...\n", dist)

	var cmd *exec.Cmd

	switch dist {
	case "debian":
		cmd = exec.Command("dpkg-deb", "--root-owner-group", "--build", stage, finalPath)

	case "arch", "manjaro":
		cmd = exec.Command("makepkg", "-s", "-f", "--noconfirm")
		cmd.Dir = stage

	case "fedora", "opensuse":

		// 1. Creiamo una cartella dedicata per l'output di RPM dentro lo stage
		rpmOutDir := filepath.Join(stage, "RPMS")
		os.MkdirAll(rpmOutDir, 0755)

		// 2. Il percorso del file .spec generato in precedenza dal Sarto
		specFile := filepath.Join(stage, "oa-tools.spec")

		// 3. Prepariamo il comando isolando rpmbuild nello staging
		cmd = exec.Command("rpmbuild", "-bb",
			"--define", fmt.Sprintf("_stagedir %s", stage),
			"--define", fmt.Sprintf("_rpmdir %s", rpmOutDir),
			specFile,
		)

	default:
		fmt.Printf("⚠️ Distro %s non ancora implementata nel packager\n", dist)
		return
	}

	fmt.Printf("[build] Esecuzione comando: %s\n", cmd.String())
	cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Printf("❌ Fallimento Montatore: %v\n", err)
		return
	}

	fmt.Printf("✅ Pacchetto sfornato in: %s\n", finalPath)
}
