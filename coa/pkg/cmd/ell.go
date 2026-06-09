package cmd

import (
	"fmt"
	"io"
	"os"

	"coa/pkg/dispatcher" // Il tuo nuovo pacchetto

	"github.com/spf13/cobra"
)

var ellCmd = &cobra.Command{
	Use:   "ell",
	Short: "Esegue un task delegato dal motore C",
	RunE: func(cmd *cobra.Command, args []string) error {
		// 1. Legge il payload JSON inviato dal programma C tramite pipe
		payload, err := io.ReadAll(os.Stdin)
		if err != nil {
			return fmt.Errorf("errore di lettura da stdin: %w", err)
		}

		if len(payload) == 0 {
			return fmt.Errorf("nessun payload ricevuto dal motore C")
		}

		// 2. Passa la palla al vero smistatore e se ne lava le mani

		return dispatcher.RouteTask(payload)
	},
}

func init() {
	rootCmd.AddCommand(ellCmd)
}
