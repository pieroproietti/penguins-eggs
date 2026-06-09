package planner

import (
	"coa/pkg/parser"
)

// OATask rappresenta un singolo comando atomico per l'Engine (C o Go).
// Grazie all'embedding di parser.Step, eredita automaticamente i metadati
// del piano di volo (Module, Chroot, Params, Name, ecc.).
type OATask struct {
	parser.Step // Campo anonimo: encoding/json lo appiattisce automaticamente! Nessun tag necessario.

	// --- STATO INTERNO DELL'ENGINE ---
	// Campi tecnici iniettati a runtime, invisibili allo YAML dell'utente
	Type       string `json:"type,omitempty"`       // Tipo di filesystem (proc, sysfs, overlay)
	Opts       string `json:"opts,omitempty"`       // Opzioni di mount o parametri extra
	ReadOnly   bool   `json:"readonly,omitempty"`   // Flag per i bind mount
	WorkDir  string   `json:"work_dir,omitempty"` // <--- Nuovo campo	
	LiveRoot string   `json:"live_root,omitempty"`  // Go vede LiveRoot, il C vedrà live_root
}

// OAPlan è il piano di volo completo che l'orchestratore itererà.
type OAPlan struct {
	Plan           []OATask              `json:"plan"`
	IsGitHubAction bool                  `json:"is_github_action,omitempty"` // Aggiunto tag JSON per coerenza
	Settings       parser.RemasterConfig `json:"settings"`
}
