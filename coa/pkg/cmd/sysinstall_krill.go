package cmd

import (
	"fmt"
	"os"
	"os/exec"

	"coa/pkg/sysinstall/krill"
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
		if !utils.IsLive() && !sysinstallCoexist {
			utils.Fatal("sysinstall krill can only be run on a live system.")
		}
		if krillFstype != "" && krillFstype != "ext4" && krillFstype != "btrfs" {
			utils.Fatal("Invalid fstype: %s. Supported values: ext4, btrfs", krillFstype)
		}
		runKrillInstaller(AppVersion, krillFstype, sysinstallCoexist)
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
	if err := setup.BuildInstaller(oaVersion); err != nil {
		utils.LogError("Installer environment setup error: %v", err)
		os.Exit(1)
	}

	utils.LogNormal("%s[Krill]%s Starting the TUI installer...", utils.ColorCyan, utils.ColorReset)

	installed, err := krill.RunWithOptions(fstype, coexist)
	if err != nil {
		utils.LogNormal("%s[Krill Error]%s Installation was interrupted: %v", utils.ColorRed, utils.ColorReset, err)
		os.Exit(1)
	}

	if installed && coexist {
		updateHostBootloader()
	}

	utils.LogNormal("%s[Krill]%s Exiting installer.", utils.ColorGreen, utils.ColorReset)
	os.Exit(0)
}

func init() {
	sysinstallCmd.PersistentFlags().StringVar(&krillFstype, "fstype", "",
		"filesystem type to use (ext4, btrfs)")
	sysinstallCmd.PersistentFlags().BoolVar(&sysinstallCoexist, "coexist", false,
		"allow installation to Coexist slots on an installed system using local ISO/squashfs")
	sysinstallCmd.AddCommand(krillSubCmd)
}
