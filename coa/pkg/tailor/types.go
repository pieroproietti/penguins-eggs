package tailor

import "coa/pkg/planner"

// WardrobeInfo per List e Show rapido
type WardrobeInfo struct {
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
}

// Suit rappresenta il nuovo standard index.yaml
type Suit struct {
	Name        string           `yaml:"name"`
	Description string           `yaml:"description"`
	Packages    []string         `yaml:"packages"`    // Pacchetti di riferimento (Debian) - forma piatta (legacy)
	Accessories []string         `yaml:"accessories"` // Altri vestiti inclusi - forma piatta (legacy)
	Cmds        []string         `yaml:"cmds"`        // Comandi post-install - forma piatta (legacy)
	Dress       []planner.OATask `yaml:"dress"`       // Task complessi opzionali

	// Forma annidata, usata dalla maggior parte dei costume attuali
	// (owl, duck, chicks, albatros, eagle, gypaetus, seagull...).
	Distributions []string  `yaml:"distributions"`
	Sequence      *Sequence `yaml:"sequence"`
	Finalize      *Finalize `yaml:"finalize"`
	Reboot        bool      `yaml:"reboot"`

	// Popolato da normalize() a partire da Sequence.PackagesNoInstallRecommends.
	PackagesNoRecommends []string `yaml:"-"`
}

// Sequence raccoglie repository, pacchetti e accessori nella forma annidata.
type Sequence struct {
	Repositories                *Repositories `yaml:"repositories"`
	Packages                    []string      `yaml:"packages"`
	PackagesNoInstallRecommends []string      `yaml:"packages_no_install_recommends"`
	Accessories                 []string      `yaml:"accessories"`
	Cmds                        []string      `yaml:"cmds"`
}

// Repositories descrive le modifiche alle sorgenti apt prima dell'installazione.
type Repositories struct {
	SourcesList   []string `yaml:"sources_list"`   // componenti da abilitare: main, contrib, non-free...
	SourcesListD  []string `yaml:"sources_list_d"` // comandi shell letterali (aggiunta repo di terze parti)
	Update        bool     `yaml:"update"`
	Upgrade       bool     `yaml:"upgrade"`
}

// Finalize raccoglie i comandi eseguiti a fine costume nella forma annidata.
type Finalize struct {
	Customize bool     `yaml:"customize"`
	Cmds      []string `yaml:"cmds"`
}

// normalize fonde i campi della forma annidata (Sequence/Finalize) in quelli
// piatti (Packages/Accessories/Cmds) usati dal resto del pacchetto, cosi'
// applySuit non deve conoscere la differenza tra le due forme.
func (s *Suit) normalize() {
	if s.Sequence != nil {
		s.Packages = append(s.Packages, s.Sequence.Packages...)
		s.Accessories = append(s.Accessories, s.Sequence.Accessories...)
		s.Cmds = append(s.Cmds, s.Sequence.Cmds...)
		s.PackagesNoRecommends = append(s.PackagesNoRecommends, s.Sequence.PackagesNoInstallRecommends...)
	}
	if s.Finalize != nil {
		s.Cmds = append(s.Cmds, s.Finalize.Cmds...)
	}
}
