package cmd

import (
	"fmt"
	"os"

	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var adaptCmd = &cobra.Command{
	Use:   "adapt",
	Short: "Adapt the video resolution to the Virtual Machine window",
	Long: `The 'adapt' command is a post-boot utility specifically designed for live environments running inside Virtual Machines (such as VirtualBox, VMware, or QEMU/KVM). 

When executed, it forces the guest operating system to dynamically resize its display resolution to perfectly match the current dimensions of the host's VM window, improving the user experience during testing.`,
	Example: `  # Automatically resize the live system display to fit the VM window
  eggs adapt`,
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

	adapted := false
	for _, output := range virtualOutputs {
		err := utils.ExecQuiet(fmt.Sprintf("xrandr --output %s --auto", output))
		if err == nil {
			adapted = true
		}
	}

	if adapted {
		// Se eseguito con sudo (EUID == 0), riavvia il servizio di sistema spice-vdagent.
		// Altrimenti, riavvia solo l'istanza utente di spice-vdagent (con -x per non
		// toccare il demone di root spice-vdagentd) senza chiedere password.
		if os.Geteuid() == 0 {
			_ = utils.ExecQuiet("systemctl restart spice-vdagent 2>/dev/null || true")
		} else {
			_ = utils.ExecQuiet("pkill -x spice-vdagent && spice-vdagent >/dev/null 2>&1 || true")
		}

		utils.LogSuccess("Resolution adapted.")
	} else {
		utils.LogNormal("No virtual outputs found to adapt.")
	}
}
