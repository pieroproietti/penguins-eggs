package cmd

import (
	"path/filepath"

	"coa/pkg/sysinstall/krill/engine"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var coexistInstallCmd = &cobra.Command{
	Use:   "install [slot]",
	Short: "Launch Krill installer directly in Coexist mode",
	Long: `Launch the Krill TUI installer directly in Coexist mode to install the current
system into a Coexist ROOT slot.

If a slot device is optionally provided (e.g. /dev/sda2), Krill will preselect that
slot and automatically propose the System Name (e.g. sda2-debian).

Examples:
  sudo eggs coexist install
  sudo eggs coexist install /dev/sda2
  sudo eggs coexist install --fstype btrfs`,
	Args: cobra.MaximumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements("coexist install", true)

		coexistDisks := engine.DetectCoexistDisks()
		if len(coexistDisks) == 0 {
			utils.Fatal("No Coexist disks detected. Initialize one first with: sudo eggs coexist init <device>")
		}

		targetSlot := ""
		if len(args) == 1 {
			targetSlot = args[0]
			evalSlot, err := filepath.EvalSymlinks(targetSlot)
			if err == nil {
				targetSlot = evalSlot
			}

			found := false
			for _, d := range coexistDisks {
				for _, s := range d.Slots {
					if s.Device == targetSlot {
						found = true
						break
					}
				}
				if found {
					break
				}
			}
			if !found {
				utils.LogWarning("Slot %s was not found among detected Coexist slots.", targetSlot)
				utils.LogNormal("Starting installer with manual slot selection...")
				targetSlot = ""
			}
		}

		if krillFstype != "" && krillFstype != "ext4" && krillFstype != "btrfs" {
			utils.Fatal("Invalid fstype: %s. Supported values: ext4, btrfs", krillFstype)
		}

		utils.LogNormal("Launching Krill installer in Coexist mode...")
		runKrillInstallerWithSlot(AppVersion, krillFstype, true, targetSlot)
	},
}

func init() {
	coexistInstallCmd.Flags().StringVar(&krillFstype, "fstype", "", "filesystem type to use (ext4, btrfs)")
	coexistCmd.AddCommand(coexistInstallCmd)
}
