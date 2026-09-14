package krill

import (
	"fmt"
	"os"
	"strings"
	"time"

	"coa/pkg/sysinstall/krill/engine"
)

const UnattendedPassword = "evolution"

type UnattendedOptions struct {
	Fstype     string
	Coexist    bool
	TargetPart string
	HomePart   string
	InstallID  string
	NoPoweroff bool
}

func RunUnattended(fstype string) error {
	return RunUnattendedWithOptions(UnattendedOptions{Fstype: fstype})
}

func RunUnattendedWithOptions(opts UnattendedOptions) error {
	cfg, err := LoadInstallerConfig(DefaultConfigRoot)
	if err != nil {
		return fmt.Errorf("installer configuration not found in %s: %w", DefaultConfigRoot, err)
	}
	for _, w := range cfg.Warnings {
		fmt.Fprintf(os.Stderr, "[krill] warning: %s\n", w)
	}

	m := initialModelWithOptions(cfg, opts.Fstype, opts.Coexist)
	m.userInputs[fieldUserPass].SetValue(UnattendedPassword)
	m.userInputs[fieldRootPass].SetValue(UnattendedPassword)

	if opts.Coexist {
		m.diskModeIdx = 2
		m.coexistStage = coexistInstall

		// If TargetPart is specified, locate the corresponding disk and partition index
		if opts.TargetPart != "" {
			found := false
			for dIdx, d := range m.disks {
				parts := DetectPartitions(d.Path)
				for _, p := range parts {
					if p.Path == opts.TargetPart {
						m.diskIdx = dIdx
						m.refreshPartitions()
						for cIdx, cp := range m.candidateParts {
							if cp.Path == opts.TargetPart {
								m.partIdx = cIdx
								found = true
								break
							}
						}
						break
					}
				}
				if found {
					break
				}
			}
			if !found {
				return fmt.Errorf("target partition %s not found or not eligible for installation", opts.TargetPart)
			}
		} else {
			m.refreshPartitions()
			if len(m.candidateParts) > 0 {
				m.partIdx = 0
				// Prefer an uninstalled slot (label root or rootN)
				for cIdx, cp := range m.candidateParts {
					if strings.HasPrefix(cp.Label, "root") {
						m.partIdx = cIdx
						break
					}
				}
			}
		}

		if len(m.candidateParts) == 0 || m.partIdx < 0 {
			return fmt.Errorf("no candidate root slot found on %s for Coexist installation", m.disks[m.diskIdx].Path)
		}

		if len(m.efiParts) > 0 {
			m.efiIdx = 0
		} else {
			return fmt.Errorf("no valid ESP partition found on %s", m.disks[m.diskIdx].Path)
		}

		if opts.HomePart != "" {
			found := false
			for hIdx, hp := range m.homeParts {
				if hp.Path == opts.HomePart {
					m.homeIdx = hIdx
					found = true
					break
				}
			}
			if !found {
				return fmt.Errorf("shared home partition %s not found", opts.HomePart)
			}
		} else if len(m.homeParts) == 1 {
			m.homeIdx = 0
		}

		// Installation ID
		id := opts.InstallID
		if id == "" {
			slotLabel := m.candidateParts[m.partIdx].Label
			if strings.HasPrefix(slotLabel, "root") {
				num := strings.TrimPrefix(slotLabel, "root")
				id = "coe-" + num
			} else if slotLabel != "" && !strings.HasPrefix(slotLabel, "coe") {
				id = slotLabel
			} else {
				id = "coe-slot"
			}
		}
		m.homeNamespace = id
		m.userInputs[fieldHostname].SetValue(id)
	}

	plan := m.buildPlan()

	fmt.Printf("krill unattended — installing %s\n", m.productName)
	if opts.Coexist {
		fmt.Printf("  mode       : Coexist\n")
		fmt.Printf("  device     : %s\n", plan.Device)
		fmt.Printf("  root slot  : %s (ID: %s)\n", plan.TargetPartition, plan.EFIBootloaderID)
		fmt.Printf("  ESP        : %s\n", plan.EspPartition)
		if plan.HomePartition != "" {
			fmt.Printf("  shared HOME: %s (/srv/homes/%s)\n", plan.HomePartition, plan.HomeNamespace)
		} else {
			fmt.Printf("  shared HOME: none (/home on ROOT)\n")
		}
		fmt.Printf("  source     : %s\n", plan.UnpackSource)
	} else {
		fmt.Printf("  device     : %s (ALL DATA WILL BE ERASED)\n", plan.Device)
	}
	fmt.Printf("  filesystem : %s, swap: %s\n", plan.FsType, plan.Swap)
	fmt.Printf("  user       : %s (password: %s), hostname: %s\n", plan.Login, UnattendedPassword, plan.Hostname)

	countdown := 10
	if opts.Coexist {
		countdown = 3
	}
	fmt.Printf("\nCtrl+C to cancel, starting in %d seconds...\n", countdown)
	for i := countdown; i > 0; i-- {
		fmt.Printf("\r%d... ", i)
		time.Sleep(time.Second)
	}
	fmt.Println()

	return engine.Run(plan, func(ev engine.Event) {
		if ev.Index >= ev.Total {
			fmt.Println(ev.Message)
			return
		}
		fmt.Printf("[%2d/%2d] %s\n", ev.Index+1, ev.Total, ev.Message)
	})
}
