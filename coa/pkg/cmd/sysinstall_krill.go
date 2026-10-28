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
	"fmt"
	"os"
	"os/exec"

	"coa/pkg/census"
	"coa/pkg/sysinstall/krill"
	"coa/pkg/sysinstall/krill/engine"
	"coa/pkg/sysinstall/setup"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var krillFstype string

var krillSubCmd = &cobra.Command{
	Use:   "krill",
	Short: "Launch the Krill text installer (TUI)",
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements("sysinstall krill", true)
		hasCoexist := len(engine.DetectCoexistDisks()) > 0
		if !utils.IsLive() && !sysinstallCoexist && !hasCoexist {
			utils.Fatal("sysinstall krill can only be run on a live system, unless a Coexist disk is present.")
		}
		if !utils.IsLive() && setup.FindSquashfsPath() == setup.ErrorSquashfsNotFound {
			utils.Fatal("No live squashfs image found (%s). On an installed system, run 'sudo eggs remaster' first to create the ISO image to install.", setup.ErrorSquashfsNotFound)
		}
		if krillFstype != "" && krillFstype != "ext4" && krillFstype != "btrfs" {
			utils.Fatal("Invalid fstype: %s. Supported values: ext4, btrfs", krillFstype)
		}
		runKrillInstallerWithSlot(AppVersion, krillFstype, sysinstallCoexist || (!utils.IsLive() && hasCoexist), "")
	},
}

func updateHostBootloader() {
	if utils.IsLive() {
		return
	}
	utils.LogNormal("Updating host bootloader configuration...")
	if _, err := exec.LookPath("update-grub"); err == nil {
		if err := utils.Exec("update-grub"); err != nil {
			utils.LogWarning("Failed to update host bootloader: %v", err)
		}
	} else if _, err := exec.LookPath("grub-mkconfig"); err == nil {
		cfgPath := "/boot/grub/grub.cfg"
		if _, err := os.Stat("/boot/grub2/grub.cfg"); err == nil {
			cfgPath = "/boot/grub2/grub.cfg"
		}
		if err := utils.Exec(fmt.Sprintf("grub-mkconfig -o %s", cfgPath)); err != nil {
			utils.LogWarning("Failed to update host bootloader: %v", err)
		}
	} else if _, err := exec.LookPath("grub2-mkconfig"); err == nil {
		cfgPath := "/boot/grub2/grub.cfg"
		if _, err := os.Stat("/boot/grub/grub.cfg"); err == nil {
			cfgPath = "/boot/grub/grub.cfg"
		}
		if err := utils.Exec(fmt.Sprintf("grub2-mkconfig -o %s", cfgPath)); err != nil {
			utils.LogWarning("Failed to update host bootloader: %v", err)
		}
	}
}

func runKrillInstaller(oaVersion string, fstype string, coexist bool) {
	runKrillInstallerWithSlot(oaVersion, fstype, coexist, "")
}

func runKrillInstallerWithSlot(oaVersion string, fstype string, coexist bool, targetSlot string) {
	_ = os.Setenv("EGGS_VERSION", oaVersion)
	if sysinstallAnonymous {
		_ = os.Setenv("EGGS_ANONYMOUS", "1")
	}

	if err := setup.BuildInstaller(oaVersion); err != nil {
		utils.LogError("Installer environment setup error: %v", err)
		os.Exit(1)
	}

	utils.LogNormal("%s[Krill]%s Starting the TUI installer...", utils.ColorCyan, utils.ColorReset)

	installed, err := krill.RunWithSlot(fstype, coexist, targetSlot)
	if err != nil {
		utils.LogNormal("%s[Krill Error]%s Installation was interrupted: %v", utils.ColorRed, utils.ColorReset, err)
		os.Exit(1)
	}

	if installed {
		if coexist {
			updateHostBootloader()
		}

		if !krill.CensusSent() {
			sqPath := setup.FindSquashfsPath()
			_, isCrypted, isClone := census.DetectLiveSourceMode(sqPath)
			if !isCrypted {
				parentID := census.DetectParentIDFromSource(sqPath)
				census.Send(census.EventOptions{
					Action:      "sysinstall",
					EggsVersion: oaVersion,
					Anonymous:   sysinstallAnonymous,
					Clone:       isClone,
					TargetRoot:  engine.DefaultTarget,
					ParentID:    parentID,
				})
			}
		}
	}

	utils.LogNormal("%s[Krill]%s Exiting installer.", utils.ColorGreen, utils.ColorReset)
	if installed {
		krill.ExecutePendingRestart()
	}
	os.Exit(0)
}

func init() {
	sysinstallCmd.PersistentFlags().StringVar(&krillFstype, "fstype", "",
		"filesystem type to use (ext4, btrfs)")
	sysinstallCmd.PersistentFlags().BoolVar(&sysinstallCoexist, "coexist", false,
		"allow installation to Coexist slots on an installed system using local ISO/squashfs")
	sysinstallCmd.AddCommand(krillSubCmd)
}
