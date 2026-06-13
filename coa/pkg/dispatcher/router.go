package dispatcher

import (
	"encoding/json"
	"fmt"

	"coa/pkg/worker" // Assicurati che l'import sia corretto per il tuo modulo
)

// TaskEnvelope serve SOLO per sbirciare il nome del modulo e fare log
type TaskEnvelope struct {
	Module string `json:"module"`
	Chroot bool   `json:"chroot"` // Lo teniamo qui solo per stamparlo nel log
}

// RouteTask analizza la busta e smista il lavoro passando TUTTO il payload originale
func RouteTask(payload []byte) error {
	var envelope TaskEnvelope

	// 1. Facciamo un Unmarshal "parziale": Go estrarrà solo i campi
	// definiti in TaskEnvelope (Module e Chroot) e ignorerà il resto.
	if err := json.Unmarshal(payload, &envelope); err != nil {
		return fmt.Errorf("dispatcher: errore parsing JSON dal C: %w", err)
	}

	// Logging centrale per capire cosa sta succedendo
	fmt.Printf("🔀 [dispatcher] Routing task per modulo: '%s' (chroot: %v)\n", envelope.Module, envelope.Chroot)

	// 2. Lo switch passa direttamente i byte crudi. I worker faranno un SECONDO Unmarshal,
	// ma questa volta usando le loro struct specifiche e complete.
	switch envelope.Module {
	case "autologin-gui":
		return worker.RunAutologin(payload)

	case "copy":
		return worker.RunCopy(payload)

	case "mksquashfs":
		return worker.RunMksquashfs(payload)

	// case "script":
	// 		return worker.RunScript(payload)

	case "shell":
		return worker.RunShell(payload)

	case "template":
		return worker.RunTemplate(payload)

	case "xorriso":
		return worker.RunXorriso(payload)
	default:
		return fmt.Errorf("dispatcher: modulo sconosciuto '%s'", envelope.Module)
	}
}
