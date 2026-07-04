package tailor

import (
	"bufio"
	"fmt"
	"os"
	"os/user"
	"path/filepath"
	"strconv"
	"strings"
)

// getWardrobeRoot devuelve ~/.oa-wardrobe del usuario "real" que está
// detrás de esta ejecución.
//
// Con 'sudo coa wardrobe wear ...' alcanza con SUDO_USER. Pero
// 'coa wardrobe wear' ahora exige euid 0 (ver Wear() en wear.go), y en
// distros como Quirinux, que no traen sudo configurado por defecto, la
// forma normal de llegar a ese euid 0 es 'su' -- que NO define
// SUDO_USER. En ese caso, os.UserHomeDir() devuelve /root, y coa
// terminaba buscando el wardrobe en /root/.oa-wardrobe en vez de en el
// home real donde el usuario lo clonó (p.ej. /home/quirinux2).
//
// Por eso, sin SUDO_USER, buscamos el primer usuario humano real en
// /etc/passwd (UID 1000-59999, shell de login válida) antes de resignarnos
// a usar el home del proceso actual.
func getWardrobeRoot() (string, error) {
	var homeDir string

	sudoUser := os.Getenv("SUDO_USER")
	if sudoUser != "" {
		if u, err := user.Lookup(sudoUser); err == nil {
			homeDir = u.HomeDir
		}
	}

	if homeDir == "" {
		if u := firstHumanUser(); u != nil {
			homeDir = u.HomeDir
		}
	}

	if homeDir == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", fmt.Errorf("unable to determine home directory: %v", err)
		}
		homeDir = home
	}

	return filepath.Join(homeDir, ".oa-wardrobe"), nil
}

// firstHumanUser busca el primer usuario real (no de sistema) en
// /etc/passwd: UID entre 1000 y 59999, con una shell de login válida.
func firstHumanUser() *user.User {
	f, err := os.Open("/etc/passwd")
	if err != nil {
		return nil
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		fields := strings.Split(scanner.Text(), ":")
		if len(fields) < 7 {
			continue
		}
		uid, err := strconv.Atoi(fields[2])
		if err != nil || uid < 1000 || uid >= 60000 {
			continue
		}
		shell := fields[6]
		if strings.HasSuffix(shell, "nologin") || strings.HasSuffix(shell, "/false") {
			continue
		}
		if u, err := user.Lookup(fields[0]); err == nil {
			return u
		}
	}
	return nil
}
