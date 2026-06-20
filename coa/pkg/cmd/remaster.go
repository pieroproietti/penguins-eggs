package cmd

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"coa/pkg/pathDefaults"
	"coa/pkg/distro"
	"coa/pkg/parser"
	"coa/pkg/planner"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var (
	producePath string
	stopAfter   string
	debugPlan   bool
	cloneFlag   bool
	cryptedFlag bool
)

var remasterCmd = &cobra.Command{
	Use:   "remaster",
	Short: "Start a system remastering (ISO production)",
	Long: `The 'remaster' command orchestrates the creation of a bootable live ISO. 
It uses the new Coala architecture to read the agnostic Brain profile 
and generate a precise execution plan for the OA planner.`,
	Example: `  # Standard ISO remastering
  sudo ./coa remaster

  # Clone mode (preserves users and /home)
  sudo ./coa remaster --clone

  # Crypted mode (LUKS-encrypted squashfs)
  sudo ./coa remaster --crypted

  # Debug mode: stop after a specific step
  sudo ./coa remaster --stop-after coa-initrd

  # Print the generated JSON plan and exit
  sudo ./coa remaster --debug`,
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements(cmd.Name(), true)

		if cloneFlag && cryptedFlag {
			utils.Fatal("The --clone and --crypted flags are mutually exclusive.")
		}

		produceMode := "standard"
		if cloneFlag {
			produceMode = "clone"
		} else if cryptedFlag {
			produceMode = "crypted"
		}

		utils.LogNormal("Starting remastering procedure (mode: %s)...", produceMode)

		myDistro := distro.NewDistro()

		if produceMode == "crypted" && myDistro.FamilyID != "debian" {
			utils.Fatal("The --crypted option is only available for the Debian family (detected: %s).", myDistro.DistroLike)
		}

		var luksPassphrase string
		if produceMode == "crypted" {
			if err := os.MkdirAll(pathDefaults.StagingDir, 0755); err != nil {
				utils.Fatal("Unable to create %s: %v", pathDefaults.StagingDir, err)
			}

			var err error
			luksPassphrase, err = promptLuksPassword()
			if err != nil {
				utils.Fatal("LUKS passphrase error: %v", err)
			}
			utils.LogSuccess("LUKS passphrase acquired (will not be written to disk).")

			cryptoCfg := promptCryptoConfig()
			if err := saveCryptoConfig(cryptoCfg); err != nil {
				utils.Fatal("Unable to save crypto configuration: %v", err)
			}
			utils.LogSuccess("Crypto configuration saved.")
		}

		isGitHubAction := false
		if _, err := os.Stat("/home/runner/work"); !os.IsNotExist(err) {
			isGitHubAction = true
		}

		isoName := myDistro.GetISOName(produceMode)

		// After profile is loaded, check for custom ISO prefix — but we need
		// the name early for disk-space checks, so we peek at custom settings here.
		if customCfg, err := parser.LoadCustomSettings(); err == nil && customCfg != nil && customCfg.Remaster.ISOPrefix != "" {
			isoName = fmt.Sprintf("%s-%s.iso", customCfg.Remaster.ISOPrefix, time.Now().Format("2006-01-02_1504"))
		}

		finalIsoPath := filepath.Join(producePath, isoName)
		utils.LogNormal("ISO will be generated at: %s", finalIsoPath)

		profile, err := parser.DetectAndLoad(isGitHubAction)
		if err != nil {
			utils.Fatal("Unable to load Brain Profile: %v", err)
		}
		utils.LogSuccess("Profile loaded successfully.")

		utils.LogNormal("Fetching bootloaders (penguins-bootloaders)...")
		utils.EnsureBootloaders(pathDefaults.BootloadersDir)

		utils.LogNormal("Generating exclude list (%s mode)...", produceMode)
		excludeListPath := planner.GenerateExcludeList(produceMode, isGitHubAction)

		compression := "zstd"
		if profile.Settings.Remaster.Compression.Algorithm != "" {
			compression = profile.Settings.Remaster.Compression.Algorithm
		}

		if !isGitHubAction {
			utils.LogNormal("Checking available disk space...")
			snapshotDir := filepath.Dir(finalIsoPath)
			report, err := planner.CheckDiskSpace(producePath, snapshotDir, compression, excludeListPath)
			if err != nil {
				utils.LogWarning("Could not verify disk space: %v", err)
			} else {
				utils.LogNormal("Space estimate:\n%s", report.String())
				needed := report.NeededKiB()
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
				utils.LogSuccess("Disk space check passed.")
			}
		}

		planPath, planJSON, err := planner.GeneratePlan(
			profile,
			myDistro.FamilyID,
			isGitHubAction,
			true,
			producePath,
			finalIsoPath,
			stopAfter,
			debugPlan,
			produceMode,
			luksPassphrase,
		)
		if err != nil {
			utils.Fatal("Unable to generate the flight plan: %v", err)
		}

		utils.LogNormal("Handing off to the OA engine...")

		var oaCmd *exec.Cmd
		if produceMode == "crypted" {
			// Crypted mode: plan goes via stdin, no file on disk
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

		if stopAfter != "" {
			utils.LogWarning("Breakpoint reached and environment safely unmounted. Ready for inspection!")
		} else {
			utils.LogSuccess("Remastering complete! The egg is ready.")
		}
	},
}

var produceCmd = &cobra.Command{
	Use:   "produce",
	Short: "Alias for remaster (penguins-eggs compatibility)",
	Run:   remasterCmd.Run,
}

func init() {
	remasterCmd.Flags().StringVar(&producePath, "path", pathDefaults.DefaultWorkPath, "working directory")
	remasterCmd.Flags().BoolVar(&cloneFlag, "clone", false, "Clone the system preserving users and /home")
	remasterCmd.Flags().BoolVar(&cryptedFlag, "crypted", false, "Create an ISO with LUKS-encrypted filesystem.squashfs")
	remasterCmd.Flags().StringVar(&stopAfter, "stop-after", "", "Stop execution after a specific step (e.g. coa-initrd)")
	remasterCmd.Flags().BoolVar(&debugPlan, "debug", false, "Print the JSON plan and exit without remastering")

	produceCmd.Flags().StringVar(&producePath, "path", pathDefaults.DefaultWorkPath, "working directory")
	produceCmd.Flags().BoolVar(&cloneFlag, "clone", false, "Clone the system preserving users and /home")
	produceCmd.Flags().BoolVar(&cryptedFlag, "crypted", false, "Create an ISO with LUKS-encrypted filesystem.squashfs")
	produceCmd.Flags().StringVar(&stopAfter, "stop-after", "", "Stop execution after a specific step (e.g. coa-initrd)")
	produceCmd.Flags().BoolVar(&debugPlan, "debug", false, "Print the JSON plan and exit without remastering")

	rootCmd.AddCommand(remasterCmd)
	rootCmd.AddCommand(produceCmd)
}

