package cmd

import (
	"coa/pkg/tailor"

	"github.com/spf13/cobra"
)

func wardrobeWearCmd() *cobra.Command {
	var noAcc bool
	var noFirm bool

	cmd := &cobra.Command{
		Use:   "wear [costume]",
		Short: "Indossa un vestito (costume) dal guardaroba",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return tailor.Wear(args[0], noAcc, noFirm)
		},
	}

	cmd.Flags().BoolVar(&noAcc, "no-acc", false, "Non installare gli accessori")
	cmd.Flags().BoolVar(&noFirm, "no-firm", false, "Non installare il firmware")

	return cmd
}
