/*
 * penguins-eggs - Copyright (C) 2017-2026 Piero Proietti
 * Author: Piero Proietti <piero.proietti@gmail.com>
 * https://penguins-eggs.net
 *
 * This file is part of penguins-eggs.
 * Released under the GNU GPL v3 license.
 */

package cmd

import (
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the version number of eggs",
	Run: func(cmd *cobra.Command, args []string) {
		// Non richiede permessi di root
		CheckSudoRequirements(cmd.Name(), false)
		utils.LogNormal("eggs %s - The \"master\" of remaster", AppVersion)
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
