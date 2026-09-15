package cmd

import (
	"github.com/spf13/cobra"
)

var coexistCmd = &cobra.Command{
	Use:   "coexist",
	Short: "Manage Coexist multi-boot disks and installations",
	Long: `coexist provides tools for penguins-eggs Coexist multi-boot disks.

Use 'eggs coexist init' to prepare a disk with UEFI ESP and slots,
'eggs coexist info' to inspect detected Coexist disks and slot status,
and 'eggs coexist install' to launch Krill installer directly into a slot.`,
}

func init() {
	rootCmd.AddCommand(coexistCmd)
}
