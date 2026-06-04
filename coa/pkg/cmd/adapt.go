package cmd

import (
	"fmt"

	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var adaptCmd = &cobra.Command{
	Use:   "adapt",
	Short: "Adapt the video resolution to the Virtual Machine window",
	Long: `The 'adapt' command is a post-boot utility specifically designed for live environments running inside Virtual Machines (such as VirtualBox, VMware, or QEMU/KVM). 

When executed, it forces the guest operating system to dynamically resize its display resolution to perfectly match the current dimensions of the host's VM window, improving the user experience during testing.`,
	Example: `  # Automatically resize the live system display to fit the VM window
  coa adapt`,
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements(cmd.Name(), false)
		handleAdapt()
	},
}

func init() {
	rootCmd.AddCommand(adaptCmd)
}

// =====================================================================
// LOGICA DI ADATTAMENTO (Ex-Engine)
// =====================================================================

// handleAdapt adatta la risoluzione del monitor per le Virtual Machine
func handleAdapt() {
	utils.LogNormal("Adapting monitor resolution...")

	virtualOutputs := []string{"Virtual-0", "Virtual-1", "Virtual-2", "Virtual-3"}

	for _, output := range virtualOutputs {
		// Ignoriamo gli errori e l'output in modo silenzioso, perché non tutti gli output esisteranno
		_ = utils.ExecQuiet(fmt.Sprintf("xrandr --output %s --auto", output))
	}

	utils.LogSuccess("Resolution adapted.")
}
