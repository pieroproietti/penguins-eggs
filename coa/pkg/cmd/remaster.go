package cmd

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"coa/pkg/distro"
	"coa/pkg/parser"
	"coa/pkg/pathDefaults"
	"coa/pkg/planner"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var (
	producePath      string
	targetDirFlag    string
	stopAfter        string
	debugPlan        bool
	cloneFlag        bool
	cryptedFlag      bool
	cryptedCloneFlag bool
	fdtFlag          string
	compressionFlag  string
	wizardFlag       bool
	interactiveFlag  bool
)

type RemasterOptions struct {
	ProducePath      string
	TargetDir        string
	ProduceMode      string
	CompressionAlgo  string
	CompressionLevel int
	StopAfter        string
	DebugPlan        bool
	FdtPath          string
}

var remasterCmd = &cobra.Command{
	Use:   "remaster",
	Short: "Start a system remastering (ISO production)",
	Long: `The 'remaster' command orchestrates the creation of a bootable live ISO. 
It uses the new Coala architecture to read the agnostic Brain profile 
and generate a precise execution plan for the OA planner.`,
	Example: `  # Standard ISO remastering
  sudo eggs remaster

  # Remaster and output directly to an external drive or network share
  sudo eggs remaster --target-dir /mnt/external-drive

  # Interactive wizard mode
  sudo eggs remaster --wizard

  # Clone mode (preserves users and /home)
  sudo eggs remaster --clone

  # Crypted mode (LUKS-encrypted squashfs)
  sudo eggs remaster --crypted

  # Debug mode: stop after a specific step
  sudo eggs remaster --stop-after initramfs

  # Print the generated JSON plan and exit
  sudo eggs remaster --debug`,
	Run: func(cmd *cobra.Command, args []string) {
		if wizardFlag || interactiveFlag {
			RunWizard(producePath)
			return
		}

		CheckSudoRequirements(cmd.Name(), !debugPlan)

		isCrypted := cryptedFlag || cryptedCloneFlag
		if cloneFlag && isCrypted {
			utils.Fatal("The --clone and --crypted flags are mutually exclusive.")
		}

		produceMode := "standard"
		if cloneFlag {
			produceMode = "clone"
		} else if isCrypted {
			produceMode = "crypted"
		}

		opts := RemasterOptions{
			ProducePath:     producePath,
			TargetDir:       targetDirFlag,
			ProduceMode:     produceMode,
			CompressionAlgo: compressionFlag,
			StopAfter:       stopAfter,
			DebugPlan:       debugPlan,
			FdtPath:         fdtFlag,
		}

		RunRemasterFlight(opts)
	},
}

func RunRemasterFlight(opts RemasterOptions) {
	CheckSudoRequirements("remaster", !opts.DebugPlan)

	produceMode := opts.ProduceMode
	if produceMode == "" {
		produceMode = "standard"
	}
	producePath := opts.ProducePath
	if producePath == "" {
		producePath = pathDefaults.DefaultWorkPath
	}
	if absProduce, err := utils.ResolvePath(producePath); err == nil {
		producePath = absProduce
	}

	// Load custom settings
	customCfg, _ := parser.LoadCustomSettings()

	// Check if Calamares is configured as the preferred installer but is not installed
	if customCfg != nil && customCfg.Remaster.Installer == "calamares" {
		if _, err := exec.LookPath("calamares"); err != nil {
			utils.Fatal("Calamares is configured as the installer in custom.yaml, but the 'calamares' package is not installed on this system.")
		}
	}

	targetDir := opts.TargetDir
	if targetDir == "" && customCfg != nil && customCfg.Remaster.TargetDir != "" {
		targetDir = customCfg.Remaster.TargetDir
	}

	snapshotDir := producePath
	isExternal := false
	if targetDir != "" {
		absTarget, err := utils.ResolvePath(targetDir)
		if err != nil {
			utils.Fatal("Invalid target directory %s: %v", targetDir, err)
		}
		snapshotDir = absTarget
		if snapshotDir != producePath {
			isExternal = true
		}
		if err := os.MkdirAll(snapshotDir, 0755); err != nil {
			utils.Fatal("Unable to create target directory %s: %v", snapshotDir, err)
		}
	}
	isoDir := filepath.Join(snapshotDir, "isodir")

	startTime := time.Now()

	utils.LogNormal("Starting remastering procedure (mode: %s)...", produceMode)

	myDistro := distro.NewDistro()

	if myDistro.FamilyID == "fedora" && utils.IsSELinuxEnforcing() {
		utils.LogWarning("Fedora detected with SELinux in Enforcing mode. It is strongly recommended to set SELINUX=permissive (in /etc/selinux/config or via 'sudo setenforce 0') to avoid unexplained execution blocks.")
	}

	if produceMode == "crypted" && myDistro.FamilyID != "debian" {
		utils.Fatal("The --crypted option is only available for the Debian family (detected: %s).", myDistro.DistroLike)
	}

	var luksPassphrase string
	if produceMode == "crypted" {
		// Check crypt dependencies
		if err := checkCryptDependencies(); err != nil {
			utils.Fatal("%v", err)
		}

		if err := os.MkdirAll(pathDefaults.StagingDir, 0755); err != nil {
			utils.Fatal("Unable to create %s: %v", pathDefaults.StagingDir, err)
		}

		var err error
		cryptoCfg := promptCryptoConfig()
		if err := saveCryptoConfig(cryptoCfg); err != nil {
			utils.Fatal("Unable to save crypto configuration: %v", err)
		}
		utils.LogSuccess("Crypto configuration saved.")

		luksPassphrase, err = promptLuksPassword()
		if err != nil {
			utils.Fatal("LUKS passphrase error: %v", err)
		}
		utils.LogSuccess("LUKS passphrase acquired (will not be written to disk).")
	}

	isGitHubAction := false
	if _, err := os.Stat("/home/runner/work"); !os.IsNotExist(err) {
		isGitHubAction = true
	}

	var fdtDir, fdtFile string

	if opts.FdtPath != "" && opts.FdtPath != "none" {
		fi, err := os.Stat(opts.FdtPath)
		if err != nil {
			utils.Fatal("FDT path %s not found: %v", opts.FdtPath, err)
		}
		if fi.IsDir() {
			fdtDir = opts.FdtPath
			fdtFile = "k1-x_MUSE-Book.dtb" // legacy fallback
		} else {
			fdtDir = filepath.Dir(opts.FdtPath)
			fdtFile = filepath.Base(opts.FdtPath)
		}
		fdtDir = strings.TrimSuffix(fdtDir, "/")
	}

	isoName := myDistro.GetISOName(produceMode)
	if fdtDir != "" {
		if strings.HasSuffix(isoName, ".iso") {
			isoName = strings.TrimSuffix(isoName, ".iso") + ".img"
		}
	}

	if customCfg != nil && customCfg.Remaster.ISOPrefix != "" {
		ext := ".iso"
		if runtime.GOARCH == "riscv64" || fdtDir != "" {
			ext = ".img"
		}
		isoName = fmt.Sprintf("%s-%s%s", customCfg.Remaster.ISOPrefix, time.Now().Format("2006-01-02_1504"), ext)
	}

	finalIsoPath := filepath.Join(snapshotDir, isoName)
	var symlinkIsoPath string
	if isExternal {
		symlinkIsoPath = filepath.Join(producePath, isoName)
		utils.LogNormal("Target directory configured: %s", snapshotDir)
		if strings.HasSuffix(finalIsoPath, ".img") {
			utils.LogNormal("Image will be generated at: %s (symlink at %s)", finalIsoPath, symlinkIsoPath)
		} else {
			utils.LogNormal("ISO will be generated at: %s (symlink at %s)", finalIsoPath, symlinkIsoPath)
		}
	} else {
		if strings.HasSuffix(finalIsoPath, ".img") {
			utils.LogNormal("Image will be generated at: %s", finalIsoPath)
		} else {
			utils.LogNormal("ISO will be generated at: %s", finalIsoPath)
		}
	}

	profile, err := parser.DetectAndLoad(isGitHubAction, producePath, isoDir)
	if err != nil {
		utils.Fatal("Unable to load Brain Profile: %v", err)
	}
	utils.LogSuccess("Profile loaded successfully.")

	if opts.TargetDir != "" {
		profile.Settings.Remaster.TargetDir = opts.TargetDir
	}

	if opts.CompressionAlgo != "" {
		profile.Settings.Remaster.Compression.Algorithm = opts.CompressionAlgo
	}
	if opts.CompressionLevel > 0 {
		profile.Settings.Remaster.Compression.Level = opts.CompressionLevel
	}

	if err := utils.EnsureBootloaders(pathDefaults.BootloadersDir); err != nil {
		utils.Fatal("Failed to ensure bootloaders: %v", err)
	}

	utils.LogNormal("Generating exclude list (%s mode)...", produceMode)
	excludeListPath := planner.GenerateExcludeList(produceMode, isGitHubAction)

	compression := "zstd"
	if profile.Settings.Remaster.Compression.Algorithm != "" {
		compression = profile.Settings.Remaster.Compression.Algorithm
	}

	if !isGitHubAction {
		utils.LogNormal("Checking available disk space...")
		report, err := planner.CheckDiskSpace(producePath, snapshotDir, compression, excludeListPath)
		if err != nil {
			utils.LogWarning("Could not verify disk space: %v", err)
		} else {
			utils.LogNormal("Space estimate:\n%s", report.String())
			needed := report.NeededKiB()
			if isExternal {
				neededSnapshot := report.CompressedKiB * 2
				if report.FreeSnapshotKiB < neededSnapshot {
					utils.Fatal("Not enough space on target dir %s: need %.1f GiB (squashfs + ISO), have %.1f GiB.",
						snapshotDir,
						float64(neededSnapshot)/1024.0/1024.0,
						float64(report.FreeSnapshotKiB)/1024.0/1024.0)
				}
				if report.FreeWorkKiB < report.CompressedKiB {
					utils.Fatal("Not enough space on work dir %s: need %.1f GiB, have %.1f GiB.",
						producePath,
						float64(report.CompressedKiB)/1024.0/1024.0,
						float64(report.FreeWorkKiB)/1024.0/1024.0)
				}
			} else {
				if report.FreeSnapshotKiB < report.CompressedKiB {
					utils.Fatal("Not enough space on %s: need %.1f GiB, have %.1f GiB.",
						snapshotDir,
						float64(report.CompressedKiB)/1024.0/1024.0,
						float64(report.FreeSnapshotKiB)/1024.0/1024.0)
				}
				if report.SamePartition && report.FreeSnapshotKiB < needed {
					utils.Fatal("Work dir and ISO on same partition: need %.1f GiB (2x ISO), have %.1f GiB on %s.",
						float64(needed)/1024.0/1024.0,
						float64(report.FreeSnapshotKiB)/1024.0/1024.0,
						snapshotDir)
				}
				if !report.SamePartition && report.FreeWorkKiB < report.CompressedKiB {
					utils.Fatal("Not enough space on work dir %s: need %.1f GiB, have %.1f GiB.",
						producePath,
						float64(report.CompressedKiB)/1024.0/1024.0,
						float64(report.FreeWorkKiB)/1024.0/1024.0)
				}
			}
			utils.LogSuccess("Disk space check passed.")
		}
	}

	planPath, planJSON, err := planner.GeneratePlan(
		profile,
		myDistro.FamilyID,
		isGitHubAction,
		true,
		producePath,
		isoDir,
		finalIsoPath,
		symlinkIsoPath,
		opts.StopAfter,
		opts.DebugPlan,
		produceMode,
		luksPassphrase,
		fdtDir,
		fdtFile,
	)
	if err != nil {
		utils.Fatal("Unable to generate the flight plan: %v", err)
	}

	utils.LogNormal("Handing off to the OA engine...")

	var oaCmd *exec.Cmd
	if produceMode == "crypted" {
		oaCmd = exec.Command("oa")
		oaCmd.Stdin = bytes.NewReader(planJSON)
	} else {
		oaCmd = exec.Command("oa", planPath)
	}

	oaCmd.Stdout = os.Stdout
	oaCmd.Stderr = os.Stderr

	if err := oaCmd.Run(); err != nil {
		utils.Fatal("OA engine execution failed: %v", err)
	}

	if opts.StopAfter != "" {
		utils.LogWarning("Breakpoint reached and environment safely unmounted. Ready for inspection!")
	} else {
		elapsed := time.Since(startTime)
		h := int(elapsed.Hours())
		m := int(elapsed.Minutes()) % 60
		s := int(elapsed.Seconds()) % 60

		if info, err := os.Stat(finalIsoPath); err == nil {
			sizeBytes := info.Size()
			sizeGiB := float64(sizeBytes) / 1024.0 / 1024.0 / 1024.0
			fileType := "ISO"
			if strings.HasSuffix(finalIsoPath, ".img") {
				fileType = "Image"
			}
			if sizeGiB >= 1.0 {
				utils.LogSuccess("%s: %.2f GiB in %02d:%02d:%02d — the egg is ready!", fileType, sizeGiB, h, m, s)
			} else {
				sizeMiB := float64(sizeBytes) / 1024.0 / 1024.0
				utils.LogSuccess("%s: %.1f MiB in %02d:%02d:%02d — the egg is ready!", fileType, sizeMiB, h, m, s)
			}
			if symlinkIsoPath != "" {
				utils.LogNormal("Symlink: %s -> %s", symlinkIsoPath, finalIsoPath)
			}
		} else {
			utils.LogSuccess("Remastering completed in %02d:%02d:%02d — the egg is ready!", h, m, s)
		}
	}
}

func checkCryptDependencies() error {
	cmd := exec.Command("dpkg", "-s", "cryptsetup-initramfs")
	if err := cmd.Run(); err != nil {
		// Check if package exists in database (even if not configured)
		checkCmd := exec.Command("dpkg-query", "-f", "${db:Status-Status}", "-W", "cryptsetup-initramfs")
		out, _ := checkCmd.Output()
		if string(out) != "installed" {
			return fmt.Errorf("encryption requires 'cryptsetup-initramfs'. Please install it using: sudo apt install cryptsetup-initramfs")
		}
		// If installed but dpkg -s failed, it might not be properly configured
		return fmt.Errorf("cryptsetup-initramfs is installed but not properly configured")
	}
	return nil
}

func init() {
	remasterCmd.Flags().StringVar(&producePath, "path", pathDefaults.DefaultWorkPath, "working directory")
	remasterCmd.Flags().StringVarP(&targetDirFlag, "target-dir", "t", "", "Target directory for ISO and isodir (e.g. network share or external drive)")
	remasterCmd.Flags().BoolVarP(&wizardFlag, "wizard", "w", false, "Start interactive 3-step remastering wizard")
	remasterCmd.Flags().BoolVarP(&interactiveFlag, "interactive", "i", false, "Alias for --wizard")
	_ = remasterCmd.Flags().MarkHidden("interactive")
	remasterCmd.Flags().BoolVar(&cloneFlag, "clone", false, "Clone the system preserving users and /home")
	remasterCmd.Flags().BoolVar(&cryptedFlag, "crypted", false, "Create an ISO with LUKS-encrypted filesystem.squashfs")
	remasterCmd.Flags().BoolVar(&cryptedCloneFlag, "cryptedclone", false, "Alias for --crypted")
	_ = remasterCmd.Flags().MarkHidden("cryptedclone")
	remasterCmd.Flags().StringVar(&compressionFlag, "compression", "", "SquashFS compression algorithm (zstd, xz, lz4, gzip)")
	remasterCmd.Flags().StringVar(&stopAfter, "stop-after", "", "Stop execution after a specific step (e.g. initramfs)")
	remasterCmd.Flags().BoolVar(&debugPlan, "debug", false, "Print the JSON plan and exit without remastering")
	remasterCmd.Flags().StringVar(&fdtFlag, "fdt", "", "path to Flattened Device Tree (DTB) file or directory")

	rootCmd.AddCommand(remasterCmd)
}
