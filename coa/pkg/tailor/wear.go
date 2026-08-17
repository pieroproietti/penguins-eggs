package tailor

import (
	"coa/pkg/utils"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func Wear(costumeName string, noAcc bool, noFirm bool) error {
	if os.Geteuid() != 0 {
		utils.LogError("'coa wardrobe wear' needs to install packages and write to system paths; run it as root (e.g. 'su' first, or 'sudo coa wardrobe wear %s' if sudo is configured for your user).", costumeName)
		return fmt.Errorf("must be run as root")
	}

	// DKMS safety: make sure the headers for the RUNNING kernel are in
	// place before any package is unpacked, so DKMS postinsts that build
	// for the current kernel do not abort mid-transaction.
	ensureKernelHeaders()

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

	installedPackages, failedPackages, err := applySuit(costumeDir, suit)
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
					accInstalled, accFailed, _ := applySuit(accDir, accSuit)
					installedPackages = append(installedPackages, accInstalled...)
					failedPackages = append(failedPackages, accFailed...)
				}
			}
		}
	}

	var purgedPackages []string
	var failedPurges []string

	installedBefore, _ := currentlyInstalledPackages()

	// Install everything in the manifest that's missing
	if manifestPath := findManifestPath(costumeDir, suit.PackagesManifest); manifestPath != "" {
		utils.LogNormal("--- Declarative manifest (authoritative install list): %s ---", manifestPath)
		if targetManifest, err := loadPackageManifest(manifestPath); err == nil {
			utils.LogNormal("[%s] Installing %d manifest packages...", suit.Name, len(targetManifest))
			manifestFailed := installWithRetries(targetManifest, 3)
			failedPackages = append(failedPackages, manifestFailed...)
			installedPackages = append(installedPackages, diffStr(targetManifest, manifestFailed)...)
		} else {
			utils.LogNormal(utils.ColorYellow+"WARNING: could not read packages_manifest %s: %v"+utils.ColorReset, manifestPath, err)
		}
	}

	// Load packages from external install file if specified
	if installPath := findManifestPath(costumeDir, suit.PackagesInstallFile); installPath != "" {
		utils.LogNormal("--- Loading packages from external install file: %s ---", installPath)
		if filePackages, err := loadPackageManifest(installPath); err == nil {
			utils.LogNormal("[%s] Installing %d packages from external file...", suit.Name, len(filePackages))
			fileFailed := installWithRetries(filePackages, 3)
			failedPackages = append(failedPackages, fileFailed...)
			installedPackages = append(installedPackages, diffStr(filePackages, fileFailed)...)
		} else {
			utils.LogNormal(utils.ColorYellow+"WARNING: could not read packages_install_file %s: %v"+utils.ColorReset, installPath, err)
		}
	}

	// Deterministic removal: purge exactly the vendor's remove list
	var removeList []string
	removeList = append(removeList, suit.PackagesRemove...)
	if removePath := findManifestPath(costumeDir, suit.PackagesRemoveFile); removePath != "" {
		utils.LogNormal("--- Declarative remove list: %s ---", removePath)
		if fileRemove, err := loadPackageManifest(removePath); err == nil {
			removeList = append(removeList, fileRemove...)
		} else {
			utils.LogNormal(utils.ColorYellow+"WARNING: could not read packages_remove_file %s: %v"+utils.ColorReset, removePath, err)
		}
	}
	if len(removeList) > 0 {
		purgeExplicit(removeList)
	}

	// DKMS healing: the manifest usually installs a NEWER kernel, and DKMS
	// postinsts run before that kernel's headers are on disk, aborting and
	// leaving dpkg half-configured (which then poisons every later apt-get
	// call, e.g. quirinux-firmware failing on dependencies). Repair the
	// state and retry before writing the final report.
	failedPackages = healAndRetryFailed(failedPackages)

	installedAfter, _ := currentlyInstalledPackages()
	if len(installedBefore) > 0 && len(installedAfter) > 0 {
		for p := range installedBefore {
			if _, ok := installedAfter[p]; !ok {
				purgedPackages = append(purgedPackages, p)
			}
		}
	}

	copySkelToUser()
	reportPath, reportErr := writeWearReport(wearReport{
		CostumeName:   suit.Name,
		Installed:     installedPackages,
		Purged:        purgedPackages,
		FailedInstall: failedPackages,
		FailedPurge:   failedPurges,
	})

	clearScreen()
	utils.LogNormal("Costume '%s' applied. Installed: %d | Removed: %d | Could not be installed: %d | Could not be removed: %d",
		suit.Name, len(installedPackages), len(purgedPackages), len(failedPackages), len(failedPurges))

	if reportErr != nil {
		utils.LogNormal(utils.ColorYellow+"WARNING: could not write detailed report: %v"+utils.ColorReset, reportErr)
	} else {
		utils.LogNormal("Detailed report: %s", reportPath)
	}
	if suit.Reboot {
		utils.LogNormal(utils.ColorYellow + "This costume recommends a reboot to finish applying all changes." + utils.ColorReset)
	}
	printKernelCleanupReminder()
	return nil
}

// ensureKernelHeaders installs the kernel headers matching the currently
// running kernel (plus the architecture meta-package) before any DKMS
// package is unpacked. A DKMS postinst aborts the whole transaction when
// the headers for a target kernel are missing, leaving dpkg in a
// half-configured state.
func ensureKernelHeaders() {
	out, err := exec.Command("uname", "-r").Output()
	if err != nil {
		utils.LogNormal("WARNING: could not determine running kernel version: %v", err)
		return
	}
	release := strings.TrimSpace(string(out))
	if release == "" {
		return
	}
	archOut, _ := exec.Command("dpkg", "--print-architecture").Output()
	arch := strings.TrimSpace(string(archOut))
	if arch == "" {
		arch = "amd64"
	}
	pkgs := fmt.Sprintf("linux-headers-%s linux-headers-%s", release, arch)
	utils.LogNormal("Ensuring kernel headers are present before DKMS installs: %s", pkgs)
	utils.Exec("DEBIAN_FRONTEND=noninteractive apt-get install -o Dpkg::Use-Pty=0 -y " + pkgs)
}

// healAndRetryFailed repairs the half-configured dpkg state that DKMS
// packages leave behind when kernel headers were not yet in place, then
// retries every failed package that actually exists in the apt cache.
// Packages that are simply absent from the repositories stay in the
// returned list so they keep being reported as failed.
func healAndRetryFailed(failed []string) []string {
	if len(failed) == 0 {
		return nil
	}

	utils.LogNormal("Healing dpkg state before retrying failed packages...")
	utils.Exec("dpkg --configure -a")
	utils.Exec("DEBIAN_FRONTEND=noninteractive apt-get install -f -o Dpkg::Use-Pty=0 -y")

	available := getAvailablePackages()
	var retry []string
	for _, p := range failed {
		if available == nil {
			retry = append(retry, p)
			continue
		}
		if _, ok := available[normalizePkgName(p)]; ok {
			retry = append(retry, p)
		}
	}
	if len(retry) == 0 {
		return failed
	}

	utils.LogNormal("Retrying %d packages now that kernel headers are in place...", len(retry))
	installWithRetries(retry, 1)

	var still []string
	for _, p := range failed {
		if !isPackageInstalled(p) {
			still = append(still, p)
		}
	}
	return still
}

// applySuit applies a costume/accessory and returns the list of packages
// that could not be installed (across packages, packages_no_install_recommends
// and packages_interactive), so the caller can report them to the user.
func applySuit(dir string, suit *Suit) ([]string, []string, error) {
	var installedPackages []string
	var failedPackages []string

	if suit.Sequence != nil && suit.Sequence.Repositories != nil {
		setupRepositories(suit.Sequence.Repositories, suit.Name)
		utils.LogNormal("[%s] Refreshing package index after repository changes...", suit.Name)
		if err := utils.Exec("apt-get update"); err != nil {
			utils.LogNormal("[%s] WARNING: apt-get update failed, newly added repositories may be unusable: %v", suit.Name, err)
		}
	}

	if len(suit.Packages) > 0 {
		utils.LogNormal("[%s] Attempting package installation: %v", suit.Name, suit.Packages)
		failed := installWithRetries(suit.Packages, 3)
		failedPackages = append(failedPackages, failed...)
		installedPackages = append(installedPackages, diffStr(suit.Packages, failed)...)
	} else {
		utils.LogNormal("[%s] No packages to install.", suit.Name)
	}

	if len(suit.PackagesNoRecommends) > 0 {
		utils.LogNormal("[%s] Installing packages without recommends: %v", suit.Name, suit.PackagesNoRecommends)
		failed := installNoRecommends(suit.PackagesNoRecommends)
		failedPackages = append(failedPackages, failed...)
		installedPackages = append(installedPackages, diffStr(suit.PackagesNoRecommends, failed)...)
	}

	if len(suit.PackagesInteractive) > 0 {
		utils.LogNormal("[%s] Installing interactive packages (license prompts may appear): %v", suit.Name, suit.PackagesInteractive)
		failed := installInteractive(suit.PackagesInteractive)
		failedPackages = append(failedPackages, failed...)
		installedPackages = append(installedPackages, diffStr(suit.PackagesInteractive, failed)...)
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

	return installedPackages, failedPackages, nil
}

func copySkelToUser() {
	targetUser := os.Getenv("SUDO_USER")
	var userHome string
	if targetUser != "" {
		userHome = filepath.Join("/home", targetUser)
	} else if u := firstHumanUser(); u != nil {
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
