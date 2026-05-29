package builder

import (
	sysctx "coa/pkg/context"
	"fmt"
	"os"
	"os/exec"
)

// finalPath è il percorso completo dove il pacchetto deve atterrare
func runPackager(ctx sysctx.RuntimeContext, stage string, dist string, finalPath string) {
	fmt.Printf("[build] Montatore: sigillo il pacchetto per %s...\n", dist)

	var cmd *exec.Cmd

	switch dist {
	case "debian":
		cmd = exec.Command("dpkg-deb", "--root-owner-group", "--build", stage, finalPath)

	case "archlinux":
		cmd = exec.Command("makepkg", "-s", "-f", "--noconfirm")
		cmd.Dir = stage

	default:
		fmt.Printf("⚠️ Distro %s non ancora implementata nel packager\n", dist)
		return
	}

	cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Printf("❌ Fallimento Montatore: %v\n", err)
		return
	}

	fmt.Printf("✅ Pacchetto sfornato in: %s\n", finalPath)
}
