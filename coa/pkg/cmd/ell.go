package cmd

import (
	"fmt"
	"io"
	"os"

	"coa/pkg/dispatcher"

	"github.com/spf13/cobra"
)

var ellCmd = &cobra.Command{
	Use:    "ell",
	Short:  "Execute a task delegated by the C engine",
	Hidden: true,
	RunE: func(cmd *cobra.Command, args []string) error {
		payload, err := io.ReadAll(os.Stdin)
		if err != nil {
			return fmt.Errorf("error reading from stdin: %w", err)
		}

		if len(payload) == 0 {
			return fmt.Errorf("no payload received from the C engine")
		}

		return dispatcher.RouteTask(payload)
	},
}

func init() {
	rootCmd.AddCommand(ellCmd)
}
