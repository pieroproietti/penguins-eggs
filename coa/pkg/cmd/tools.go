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
	"github.com/spf13/cobra"
)

var toolsCmd = &cobra.Command{
	Use:   "tools",
	Short: "Useful tools for maintenance and system management",
	Long: `A suite of auxiliary tools provided by eggs for the management,
cleaning, and inspection of the host system and ISOs.`,
}

func init() {
	rootCmd.AddCommand(toolsCmd)
}
