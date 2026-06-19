package cmd

import (
	"coa/pkg/xdg"

	"github.com/spf13/cobra"
)

var skelTargetUser string

var skelCmd = &cobra.Command{
	Use:   "skel",
	Short: "Create /etc/skel based on the current user's configurations",
	Run: func(cmd *cobra.Command, args []string) {
		xdg.HandleSkel(skelTargetUser)
	},
}

func init() {
	toolsCmd.AddCommand(skelCmd)
	skelCmd.Flags().StringVarP(&skelTargetUser, "user", "u", "", "Utente sorgente (default: SUDO_USER)")
}
