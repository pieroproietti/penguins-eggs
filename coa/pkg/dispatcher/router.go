package dispatcher

import (
	"encoding/json"
	"fmt"

	"coa/pkg/worker"
)

type TaskEnvelope struct {
	Module string `json:"module"`
	Chroot bool   `json:"chroot"`
}

func RouteTask(payload []byte) error {
	var envelope TaskEnvelope

	if err := json.Unmarshal(payload, &envelope); err != nil {
		return fmt.Errorf("dispatcher: error parsing JSON from C engine: %w", err)
	}

	fmt.Printf("🔀 [dispatcher] Routing task for module: '%s' (chroot: %v)\n", envelope.Module, envelope.Chroot)

	switch envelope.Module {
	case "autologin-gui":
		return worker.RunAutologin(payload)

	case "copy":
		return worker.RunCopy(payload)

	case "mksquashfs":
		return worker.RunMksquashfs(payload)

	case "script":
		return worker.RunScript(payload)

	case "shell":
		return worker.RunShell(payload)

	case "template":
		return worker.RunTemplate(payload)

	case "xorriso":
		return worker.RunXorriso(payload)
	default:
		return fmt.Errorf("dispatcher: unknown module '%s'", envelope.Module)
	}
}
