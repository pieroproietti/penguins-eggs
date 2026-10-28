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
