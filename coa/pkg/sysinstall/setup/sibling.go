package setup

import (
	"os"
	"strings"

	"gopkg.in/yaml.v3"
)

// siblingPath è scritto dal remaster (bootstrap-liveroot.sh) e vive fuori
// da InstallerDRoot, che BuildInstaller rigenera da zero ad ogni avvio
// dell'installer: è l'unico stato che sopravvive a quel wipe.
const siblingPath = "/etc/oa-tools.d/sibling.yaml"

// Sibling rispecchia sibling.yaml. Per ora registra solo il mode di
// remaster (standard/clone/crypted); in futuro potrà crescere.
type Sibling struct {
	Mode string `yaml:"mode"`
}

// readSibling legge il marker; "standard" se assente (es. sistema non
// remasterizzato, ambiente di sviluppo).
func readSibling() Sibling {
	data, err := os.ReadFile(siblingPath)
	if err != nil {
		return Sibling{Mode: "standard"}
	}

	var s Sibling
	if err := yaml.Unmarshal(data, &s); err != nil || s.Mode == "" {
		return Sibling{Mode: "standard"}
	}
	return s
}

// stripUsersModule rimuove lo step "users" dalla sequence di settings.conf:
// in mode clone/crypted gli utenti arrivano già clonati da /home, e
// Calamares/Krill (che condividono la stessa sequence) non devono più
// chiederli. Modifica testuale per non perdere i commenti del file.
func stripUsersModule(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	lines := strings.Split(string(data), "\n")
	filtered := make([]string, 0, len(lines))
	for _, line := range lines {
		if strings.TrimSpace(line) == "- users" {
			continue
		}
		filtered = append(filtered, line)
	}

	return os.WriteFile(path, []byte(strings.Join(filtered, "\n")), 0644)
}
