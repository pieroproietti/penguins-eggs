package engine

import (
	"coa/pkg/pilot"
)

// Task rappresenta un singolo comando atomico per il binario oa.
// Grazie all'embedding di pilot.Step, eredita automaticamente:
// Action, Description, RunCommand, Chroot, Path, Src, Dst, Users.
type OATask struct {
	pilot.Step `json:",inline"` // Il "cuore" proveniente dallo YAML

	// Campi tecnici specifici dell'Engine (non presenti nello YAML)
	Type       string `json:"type,omitempty"`       // Tipo di filesystem (proc, sysfs, overlay)
	Opts       string `json:"opts,omitempty"`       // Opzioni di mount o parametri extra
	ReadOnly   bool   `json:"readonly,omitempty"`   // Flag per i bind mount
	PathLiveFs string `json:"pathLiveFs,omitempty"` // Il percorso di lavoro (es. /home/eggs/ovl/liveroot)
}

// OAPlan è l'array di task che il binario oa itererà.
type OAPlan struct {
	Plan           []OATask `json:"plan"`
	IsGitHubAction bool
	Settings       pilot.RemasterConfig `json:"settings"`
}
