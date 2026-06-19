package cmd

import (
	"os"

	"coa/pkg/pathDefaults"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var destroyCmd = &cobra.Command{
	Use:   "destroy",
	Short: "Free the nest and unmount filesystems",
	Long: `Safely tears down the remastering environment. 
It uses MNT_DETACH to unmount the OverlayFS and virtual API filesystems (/dev, /proc, /sys) without affecting the running host, then removes the temporary workspace.`,
	Example: `  # Clean up the default workspace
  sudo coa destroy`,
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements(cmd.Name(), true)
		handledestroy()
	},
}

var killCmd = &cobra.Command{
	Use:    "kill",
	Short:  "Alias for destroy, (penguins-eggs compatibility)",
	Hidden: false,
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements("kill", true)
		handledestroy()
	},
}

func init() {
	rootCmd.AddCommand(destroyCmd)
	rootCmd.AddCommand(killCmd)
}

func handledestroy() {
	utils.LogNormal("Freeing the nest...")

	if err := utils.Exec("oa cleanup"); err != nil {
		utils.LogError("Cleanup (unmount) failed: %v", err)
	}

	workPath := pathDefaults.DefaultWorkPath
	utils.LogNormal("Removing workspace: %s", workPath)

	if err := utils.Exec("rm -rf " + workPath); err != nil {
		utils.LogError("Physical removal failed: %v", err)
	} else {
		utils.LogSuccess("Nest is empty. System clean.")
	}

	logFile := pathDefaults.LogFile
	utils.LogNormal("Removing log file: %s", logFile)

	if err := os.Remove(logFile); err != nil {
		if os.IsNotExist(err) {
			utils.LogNormal("Log file '%s' not found, nothing to remove.", logFile)
		} else {
			utils.LogError("Failed to remove log file: %v", err)
		}
	} else {
		utils.LogSuccess("Log file removed successfully.")
	}
}
