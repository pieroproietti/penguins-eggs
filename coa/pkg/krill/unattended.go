// File: krill/unattended.go
//
// Installazione non interattiva: stessi default della TUI (initialModel),
// stesso engine, nessuna domanda. Pensata per i test in VM e per i
// sysadmin che installano via seriale o ssh.
package krill

import (
	"fmt"
	"os"
	"time"

	"coa/pkg/krill/engine"
)

// UnattendedPassword è la password di default delle installazioni
// non interattive, come nel krill di penguins-eggs.
const UnattendedPassword = "evolution"

// RunUnattended esegue l'installazione completa senza interfaccia.
func RunUnattended() error {
	cfg, err := LoadInstallerConfig(DefaultConfigRoot)
	if err != nil {
		return fmt.Errorf("configurazione installer non trovata in %s: %w", DefaultConfigRoot, err)
	}
	for _, w := range cfg.Warnings {
		fmt.Fprintf(os.Stderr, "[krill] attenzione: %s\n", w)
	}

	// Gli stessi default che la TUI propone all'utente
	m := initialModel(cfg)
	m.userInputs[fieldUserPass].SetValue(UnattendedPassword)
	plan := m.buildPlan()

	fmt.Printf("krill unattended — installazione di %s\n", m.productName)
	fmt.Printf("  device    : %s (TUTTI I DATI VERRANNO CANCELLATI)\n", plan.Device)
	fmt.Printf("  filesystem: %s, swap: %s\n", plan.FsType, plan.Swap)
	fmt.Printf("  utente    : %s (password: %s), hostname: %s\n", plan.Login, UnattendedPassword, plan.Hostname)
	fmt.Println("\nCtrl+C per annullare, si parte tra 10 secondi...")
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
