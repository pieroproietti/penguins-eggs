package cmd

import (
	"os"

	"coa/pkg/builder"
	"coa/pkg/distro"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var buildCmd = &cobra.Command{
	Use:   "build",
	Short: "Compile binaries and generate native distribution packages (.deb, PKGBUILD)",
	Long: `The 'build' command is the integrated packaging tool for the coa/oa ecosystem.
It orchestrates the full compilation of both the C-native engine (oa) and the Go-based orchestrator (coa), triggers the automatic generation of documentation and shell completions, and finally packages everything into native distribution formats like .deb (Debian/Ubuntu) or PKGBUILD (Arch Linux).`,
	Example: `  # Compile the ecosystem and generate native packages
  coa tools build`,
	Run: func(cmd *cobra.Command, args []string) {
		if os.Geteuid() == 0 {
			utils.Fatal(" Execution aborted. Do NOT run 'coa tools build' with sudo!")
			utils.LogNormal("Compilation must be run as a normal user to avoid " +
				"creating root-owned files and packages in your workspace.")
			os.Exit(1)
		}

		myDistro := distro.NewDistro()
		builder.HandleBuild(myDistro)
	},
}

func init() {
	toolsCmd.AddCommand(buildCmd)
}
