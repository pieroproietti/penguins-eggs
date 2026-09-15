package cmd

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"coa/pkg/sysinstall/krill"
	"coa/pkg/sysinstall/krill/engine"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var (
	coexistInitSize   uint64
	coexistInitFstype string
	coexistInitYes    bool
)

var coexistInitCmd = &cobra.Command{
	Use:   "init <device>",
	Short: "Initialize a whole disk for Coexist multi-boot",
	Long: `Initialize a physical disk for Coexist multi-boot with UEFI GPT layout.
Creates a 512 MiB FAT32 EFI System Partition (ESP) and N uniform ROOT slots
(default 10 GiB each) with GPT PARTLABEL and rootN filesystem labels.

WARNING: This operation is destructive and erases all existing data on the target disk.

Examples:
  sudo eggs coexist init /dev/sda
  sudo eggs coexist init /dev/nvme1n1 --size 15 --fstype btrfs
  sudo eggs coexist init /dev/sda --yes`,
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements("coexist init", true)

		device := args[0]
		evalDev, err := filepath.EvalSymlinks(device)
		if err == nil {
			device = evalDev
		}

		if !engine.IsUEFI() {
			utils.Fatal("Coexist disk initialization requires UEFI firmware.")
		}

		if coexistInitFstype != "ext4" && coexistInitFstype != "btrfs" {
			utils.Fatal("Invalid fstype: %s. Supported values: ext4, btrfs", coexistInitFstype)
		}

		if coexistInitSize < 4 {
			utils.Fatal("Root slot size must be at least 4 GiB.")
		}

		// Prevent wiping live media
		liveDev := krill.DetectLiveDisk()
		if liveDev != "" {
			evalLive, err := filepath.EvalSymlinks(liveDev)
			if err == nil {
				liveDev = evalLive
			}
			if device == liveDev {
				utils.Fatal("Refusing to initialize the live boot device: %s", device)
			}
		}

		// Prevent wiping currently running host disk
		hostRootDisk := engine.FindHostRootDisk()
		if hostRootDisk != "" {
			evalHost, err := filepath.EvalSymlinks(hostRootDisk)
			if err == nil {
				hostRootDisk = evalHost
			}
			if device == hostRootDisk {
				utils.Fatal("Refusing to initialize the active host root disk: %s", device)
			}
		}

		rootBytes := coexistInitSize * 1024 * 1024 * 1024
		layout, err := engine.PreviewCoexistDisk(device, liveDev, rootBytes)
		if err != nil {
			utils.Fatal("Cannot initialize disk %s: %v", device, err)
		}

		layout.FsType = coexistInitFstype

		// Confirmation
		if !coexistInitYes {
			utils.LogWarning("WARNING: This operation will completely erase ALL DATA on %s!", device)
			utils.LogNormal("Planned layout:")
			utils.LogNormal("  - Partition table: GPT")
			utils.LogNormal("  - ESP: 512 MiB (FAT32)")
			utils.LogNormal("  - ROOT slots: %d slots of %d GiB (%s)", len(layout.Partitions)-1, coexistInitSize, coexistInitFstype)
			for _, p := range layout.Partitions {
				utils.LogNormal("    * %s: %s (label: %s, partlabel: %s)", p.Device, p.Filesystem, p.Label, p.PartLabel)
			}
			fmt.Printf("\nType the exact device path (%s) to confirm: ", device)
			reader := bufio.NewReader(os.Stdin)
			input, err := reader.ReadString('\n')
			if err != nil || strings.TrimSpace(input) != device {
				utils.Fatal("Initialization cancelled (confirmation did not match).")
			}
		}

		utils.LogNormal("Initializing disk %s for Coexist...", device)
		if err := engine.InitializeCoexistDisk(layout, device); err != nil {
			utils.Fatal("Initialization failed: %v", err)
		}

		utils.LogSuccess("Disk %s successfully initialized for Coexist!", device)
		utils.LogNormal("You can now install a distribution using: sudo eggs coexist install")
	},
}

func init() {
	coexistInitCmd.Flags().Uint64Var(&coexistInitSize, "size", 10, "ROOT slot size in GiB (default: 10)")
	coexistInitCmd.Flags().StringVar(&coexistInitFstype, "fstype", "ext4", "filesystem type for ROOT slots (ext4, btrfs)")
	coexistInitCmd.Flags().BoolVarP(&coexistInitYes, "yes", "y", false, "skip interactive confirmation")
	coexistCmd.AddCommand(coexistInitCmd)
}
