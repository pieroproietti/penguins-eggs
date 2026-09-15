package cmd

import (
	"fmt"
	"path/filepath"

	"coa/pkg/sysinstall/krill/engine"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var coexistInfoCmd = &cobra.Command{
	Use:   "info [device]",
	Short: "Show information and slot status of Coexist disks",
	Long: `Inspect system block devices and display details of Coexist multi-boot disks,
including ESP details, ROOT slots, filesystem types, labels, and availability status.

Examples:
  eggs coexist info
  eggs coexist info /dev/sda`,
	Args: cobra.MaximumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		var reports []engine.CoexistDiskReport

		if len(args) == 1 {
			target := args[0]
			evalTarget, err := filepath.EvalSymlinks(target)
			if err == nil {
				target = evalTarget
			}
			rep, err := engine.GetCoexistDiskReport(target)
			if err != nil {
				utils.Fatal("Cannot get Coexist report for %s: %v", target, err)
			}
			reports = []engine.CoexistDiskReport{*rep}
		} else {
			reports = engine.DetectCoexistDisks()
		}

		if len(reports) == 0 {
			utils.LogWarning("No Coexist disks detected in the system.")
			utils.LogNormal("To initialize a disk for Coexist, run: sudo eggs coexist init <device>")
			return
		}

		for _, rep := range reports {
			utils.LogNormal("================================================================================")
			utils.LogSuccess("Coexist Disk: %s (%s)", rep.Device, rep.SizeHuman)
			utils.LogNormal("  ESP: %s (%s)", rep.EspDevice, rep.EspSize)
			utils.LogNormal("  Slots (%d total):", len(rep.Slots))
			utils.LogNormal("  %-4s %-16s %-10s %-8s %-12s %-16s %s", "#", "DEVICE", "SIZE", "FS", "PARTLABEL", "LABEL", "STATUS")
			utils.LogNormal("  ------------------------------------------------------------------------------")

			for idx, s := range rep.Slots {
				status := "Available"
				if !s.IsFree {
					if s.SystemID != "" {
						status = fmt.Sprintf("Installed (%s)", s.SystemID)
					} else if s.MountPoint != "" {
						status = fmt.Sprintf("In use (%s)", s.MountPoint)
					} else {
						status = "Occupied"
					}
				}
				pLabel := s.PartLabel
				if pLabel == "" {
					pLabel = "-"
				}
				fLabel := s.Label
				if fLabel == "" {
					fLabel = "-"
				}
				fs := s.FsType
				if fs == "" {
					fs = "-"
				}

				utils.LogNormal("  %-4d %-16s %-10s %-8s %-12s %-16s %s", idx+1, s.Device, s.SizeHuman, fs, pLabel, fLabel, status)
			}
			utils.LogNormal("================================================================================")
		}
	},
}

func init() {
	coexistCmd.AddCommand(coexistInfoCmd)
}
