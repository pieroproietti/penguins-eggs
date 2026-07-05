package tailor

import (
	"coa/pkg/utils"
	"fmt"
	"os"
	"path/filepath"
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
	if err := applySuit(costumeDir, suit); err != nil {
		return err
	}

	if !noAcc && len(suit.Accessories) > 0 {
		utils.LogNormal("--- Processing %d accessories ---", len(suit.Accessories))
		for _, accName := range suit.Accessories {
			accDir := filepath.Join(root, "accessories", accName)
			if accYaml := findYaml(accDir); accYaml != "" {
				if accSuit, err := loadSuit(accYaml); err == nil {
					utils.LogNormal("Accessory: %s", accName)
					applySuit(accDir, accSuit)
				}
			}
		}
	}

	utils.LogNormal("--- Finalizing ---")
	copySkelToUser()

	utils.LogNormal("✅ Costume applied successfully!")

	if suit.Reboot {
		utils.LogNormal(utils.ColorYellow + "This costume recommends a reboot to finish applying all changes." + utils.ColorReset)
	}

	return nil
}

func applySuit(dir string, suit *Suit) error {
	if suit.Sequence != nil && suit.Sequence.Repositories != nil {
		setupRepositories(suit.Sequence.Repositories, suit.Name)
	}

	if len(suit.Packages) > 0 {
		utils.LogNormal("[%s] Attempting package installation: %v", suit.Name, suit.Packages)
		installWithRetries(suit.Packages, 3)
	} else {
		utils.LogNormal("[%s] No packages to install.", suit.Name)
	}

	if len(suit.PackagesNoRecommends) > 0 {
		utils.LogNormal("[%s] Installing packages without recommends: %v", suit.Name, suit.PackagesNoRecommends)
		installNoRecommends(suit.PackagesNoRecommends)
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

	return nil
}

func copySkelToUser() {
	targetUser := os.Getenv("SUDO_USER")
	userHome := ""

	if targetUser != "" {
		userHome = filepath.Join("/home", targetUser)
	} else if u := firstHumanUser(); u != nil {
		// Sin SUDO_USER (p.ej. se entró con 'su' en vez de 'sudo'), no
		// hay que confiar en $USER: 'su' normalmente lo pisa a "root".
		targetUser = u.Username
		userHome = u.HomeDir
	}

	if targetUser == "" || targetUser == "root" {
		utils.LogNormal("WARNING: unable to determine a non-root target user, skipping /etc/skel sync to avoid leaving files owned by root")
		return
	}

	utils.LogNormal("Syncing /etc/skel -> %s", userHome)
	cmd := fmt.Sprintf("rsync -a --no-o --no-g --chown=%s:%s /etc/skel/ %s/", targetUser, targetUser, userHome)
	utils.Exec(cmd)
}
