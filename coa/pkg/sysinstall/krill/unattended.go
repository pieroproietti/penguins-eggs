package krill

import (
	"fmt"
	"os"
	"time"

	"coa/pkg/sysinstall/krill/engine"
)

const UnattendedPassword = "evolution"

func RunUnattended(fstype string) error {
	cfg, err := LoadInstallerConfig(DefaultConfigRoot)
	if err != nil {
		return fmt.Errorf("installer configuration not found in %s: %w", DefaultConfigRoot, err)
	}
	for _, w := range cfg.Warnings {
		fmt.Fprintf(os.Stderr, "[krill] warning: %s\n", w)
	}

	m := initialModel(cfg, fstype)
	m.userInputs[fieldUserPass].SetValue(UnattendedPassword)
	plan := m.buildPlan()

	fmt.Printf("krill unattended — installing %s\n", m.productName)
	fmt.Printf("  device    : %s (ALL DATA WILL BE ERASED)\n", plan.Device)
	fmt.Printf("  filesystem: %s, swap: %s\n", plan.FsType, plan.Swap)
	fmt.Printf("  user      : %s (password: %s), hostname: %s\n", plan.Login, UnattendedPassword, plan.Hostname)
	fmt.Println("\nCtrl+C to cancel, starting in 10 seconds...")
	for i := 10; i > 0; i-- {
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
