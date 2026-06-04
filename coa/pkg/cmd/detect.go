package cmd

import (
	"coa/pkg/distro"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var detectCmd = &cobra.Command{
	Use:   "detect",
	Short: "Display detected host system information",
	Long: `The 'detect' command is a read-only diagnostic utility for the user. 

It performs a quick scan of the host environment to identify the running GNU/Linux distribution, its parent family (e.g., mapping Ubuntu to the Debian family), and the hardware architecture. 

It does not save this state or alter any configuration; it simply provides a clear overview of the environment 'coa' is currently running in.`,
	Example: `  # Display the host system profile
  coa detect`,
	Run: func(cmd *cobra.Command, args []string) {
		// Controllo sudo: è un comando informativo, non serve root
		CheckSudoRequirements(cmd.Name(), false)

		// 1. Rileva la distribuzione host
		myDistro := distro.NewDistro()

		// 2. Stampa a video usando i colori centralizzati (Senza passare per l'engine!)
		utils.LogNormal("\n%s--- coa distro detect ---%s")
		utils.LogNormal("Host Distro:     %s", myDistro.DistroID)
		utils.LogNormal("Family:          %s", myDistro.FamilyID)
		utils.LogNormal("DistroLike:      %s", myDistro.DistroLike)
		utils.LogNormal("Codename:        %s", myDistro.CodenameID)
		utils.LogNormal("Release:         %s", myDistro.ReleaseID)
	},
}

func init() {
	rootCmd.AddCommand(detectCmd)
}
