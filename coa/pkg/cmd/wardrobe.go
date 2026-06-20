package cmd

import (
	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(wardrobeCmd())
}

func wardrobeCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:    "wardrobe",
		Short:  "Gestione dei vestiti (costumes)",
		Hidden: true,
	}

	cmd.AddCommand(wardrobeGetCmd())
	cmd.AddCommand(wardrobeListCmd())
	cmd.AddCommand(wardrobeShowCmd())
	cmd.AddCommand(wardrobeWearCmd())

	return cmd
}
