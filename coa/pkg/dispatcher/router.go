package dispatcher

import (
	"encoding/json"
	"fmt"
	"os"

	"coa/pkg/census"
	"coa/pkg/sysinstall/setup"
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

	case "census":
		sqPath := setup.FindSquashfsPath()
		_, isCrypted, isClone := census.DetectLiveSourceMode(sqPath)
		if !isCrypted {
			parentID := census.DetectParentIDFromSource(sqPath)
			census.Send(census.EventOptions{
				Action:      "sysinstall",
				EggsVersion: os.Getenv("EGGS_VERSION"),
				Anonymous:   false,
				Clone:       isClone,
				TargetRoot:  os.Getenv("TARGET_ROOT"),
				ParentID:    parentID,
			})
		}
		return nil

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
