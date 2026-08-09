package tailor

import (
	"coa/pkg/utils"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func Wear(costumeName string, noAcc bool, noFirm bool) error {
	if os.Geteuid() != 0 {
		utils.LogError("'coa wardrobe wear' needs to install packages and write to system paths; run it as root (e.g. 'su' first, or 'sudo coa wardrobe wear %s' if sudo is configured for your user).", costumeName)
		return fmt.Errorf("must be run as root")
	}

	utils.LogNormal("Starting costume application for: %s", costumeName)

	root, err := getWardrobeRoot()
	if err != nil {
		utils.LogError("Wardrobe root error: %v", err)
		return err
	}

	costumeDir := filepath.Join(root, "costumes", costumeName)
	if _, err := os.Stat(costumeDir); os.IsNotExist(err) {
		return fmt.Errorf("costume '%s' not found in %s", costumeName, costumeDir)
	}

	yamlFile := findYaml(costumeDir)
	suit, err := loadSuit(yamlFile)
	if err != nil {
		return err
	}

	utils.LogNormal("--- Applying Costume: %s ---", suit.Name)
	failedPackages, err := applySuit(costumeDir, suit)
	if err != nil {
		return err
	}

	if !noAcc && len(suit.Accessories) > 0 {
		utils.LogNormal("--- Processing %d accessories ---", len(suit.Accessories))
		for _, accName := range suit.Accessories {
			accDir := filepath.Join(root, "accessories", accName)
			if accYaml := findYaml(accDir); accYaml != "" {
				if accSuit, err := loadSuit(accYaml); err == nil {
					utils.LogNormal("Accessory: %s", accName)
					accFailed, _ := applySuit(accDir, accSuit)
					failedPackages = append(failedPackages, accFailed...)
				}
			}
		}
	}

	utils.LogNormal("--- Finalizing ---")
	copySkelToUser()

	utils.LogNormal("✅ Costume applied successfully!")

	if len(failedPackages) > 0 {
		msg := fmt.Sprintf("⚠️  %d package(s) could not be installed:\n  - %s",
			len(failedPackages), strings.Join(failedPackages, "\n  - "))
		utils.LogNormal(utils.ColorYellow + msg + utils.ColorReset)
		logToFile(msg)
	}

	if suit.Reboot {
		utils.LogNormal(utils.ColorYellow + "This costume recommends a reboot to finish applying all changes." + utils.ColorReset)
	}

	return nil
}

// applySuit applies a costume/accessory and returns the list of packages
// that could not be installed (across packages, packages_no_install_recommends
// and packages_interactive), so the caller can report them to the user.
func applySuit(dir string, suit *Suit) ([]string, error) {
	var failedPackages []string

	if suit.Sequence != nil && suit.Sequence.Repositories != nil {
		setupRepositories(suit.Sequence.Repositories, suit.Name)

		// A repository that was just added is invisible to apt until the
		// package index is refreshed. Without this, every package that
		// only exists in a repo added above silently fails to be found
		// by getAvailablePackages() in wear-logic.go and gets skipped
		// rather than installed -- with no build-time error, only a
		// line in /var/log/coa-tailor.log. This is what left every
		// quirinux-* package uninstalled even though the repo's own
		// .deb installed correctly.
		utils.LogNormal("[%s] Refreshing package index after repository changes...", suit.Name)
		if err := utils.Exec("apt-get update"); err != nil {
			utils.LogNormal("[%s] WARNING: apt-get update failed, newly added repositories may be unusable: %v", suit.Name, err)
		}
	}

	if len(suit.Packages) > 0 {
		utils.LogNormal("[%s] Attempting package installation: %v", suit.Name, suit.Packages)
		failedPackages = append(failedPackages, installWithRetries(suit.Packages, 3)...)
	} else {
		utils.LogNormal("[%s] No packages to install.", suit.Name)
	}

	if len(suit.PackagesNoRecommends) > 0 {
		utils.LogNormal("[%s] Installing packages without recommends: %v", suit.Name, suit.PackagesNoRecommends)
		failedPackages = append(failedPackages, installNoRecommends(suit.PackagesNoRecommends)...)
	}

	if len(suit.PackagesInteractive) > 0 {
		utils.LogNormal("[%s] Installing interactive packages (license prompts may appear): %v", suit.Name, suit.PackagesInteractive)
		failedPackages = append(failedPackages, installInteractive(suit.PackagesInteractive)...)
	}

	if len(suit.PackagesRemove) > 0 {
		utils.LogNormal("[%s] Removing packages not needed by this vendor: %v", suit.Name, suit.PackagesRemove)
		removePackages(suit.PackagesRemove)
	}

	sysrootPath := filepath.Join(dir, "sysroot")
	if _, err := os.Stat(sysrootPath); os.IsNotExist(err) {
		sysrootPath = filepath.Join(dir, "dirs")
	}

	if _, err := os.Stat(sysrootPath); err == nil {
		utils.LogNormal("[%s] Overlay folder found: %s", suit.Name, sysrootPath)
		utils.LogNormal("[%s] Running rsync to root /...", suit.Name)

		cmd := fmt.Sprintf("rsync -aAXv %s/ /", sysrootPath)
		if err := utils.Exec(cmd); err != nil {
			utils.LogNormal("[%s] Error during overlay: %v", suit.Name, err)
		} else {
			utils.LogNormal("[%s] Overlay completed successfully.", suit.Name)
		}
	} else {
		utils.LogNormal("[%s] No sysroot/dirs folder found, skipping overlay.", suit.Name)
	}

	if len(suit.Cmds) > 0 {
		utils.LogNormal("[%s] Running %d post-installation commands...", suit.Name, len(suit.Cmds))
		for _, command := range suit.Cmds {
			utils.LogNormal("[%s] Executing: %s", suit.Name, command)
			utils.Exec(command)
		}
	}

	return failedPackages, nil
}

func copySkelToUser() {
	targetUser := os.Getenv("SUDO_USER")
	var userHome string

	if targetUser != "" {
		userHome = filepath.Join("/home", targetUser)
	} else if u := firstHumanUser(); u != nil {
		// Sin SUDO_USER (p.ej. se entró con 'su' en vez de 'sudo', como es
		// habitual en distros sin sudo configurado, como Quirinux/Devuan),
		// no hay que confiar en $USER/os.UserHomeDir(): 'su' normalmente
		// deja HOME=/root, así que antes se sincronizaba /etc/skel en la
		// carpeta equivocada.
		targetUser = u.Username
		userHome = u.HomeDir
	}

	if targetUser == "" || targetUser == "root" {
		utils.LogNormal("WARNING: unable to determine a non-root target user, skipping /etc/skel sync to avoid leaving files owned by root")
		return
	}

	utils.LogNormal("Syncing /etc/skel -> %s", userHome)
	// IMPORTANTE: 'rsync -a' preserva dueño/grupo del ORIGEN (/etc/skel,
	// propiedad de root). Sin --chown, cualquier archivo o carpeta que ya
	// existiera en el home del usuario (incluido el propio directorio home)
	// quedaba con su metadata de propietario reescrita a root en cuanto
	// rsync la tocaba, aunque el contenido no cambiara. Esto es lo que
	// deja al usuario sin acceso a su propio $HOME tras aplicar un
	// costume ("Home directory not accessible: Permission denied" en cada
	// login). --no-o --no-g --chown fija el dueño real de destino
	// explícitamente en vez de heredarlo de /etc/skel.
	cmd := fmt.Sprintf("rsync -a --no-o --no-g --chown=%s:%s /etc/skel/ %s/", targetUser, targetUser, userHome)
	utils.Exec(cmd)
}
