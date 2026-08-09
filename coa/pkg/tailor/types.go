package tailor

import "coa/pkg/planner"

// WardrobeInfo per List e Show rapido
type WardrobeInfo struct {
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
}

// Suit rappresenta il nuovo standard index.yaml
type Suit struct {
	Name          string           `yaml:"name"`
	Description   string           `yaml:"description"`
	Packages      []string         `yaml:"packages"`
	Accessories   []string         `yaml:"accessories"`
	Cmds          []string         `yaml:"cmds"`
	Dress         []planner.OATask `yaml:"dress"`
	Distributions []string         `yaml:"distributions"`
	Sequence      *Sequence        `yaml:"sequence"`
	Finalize      *Finalize        `yaml:"finalize"`
	Reboot        bool             `yaml:"reboot"`
	// PackagesManifest points to a file (relative to the costume dir)
	// listing the COMPLETE, exact set of packages the system should end
	// up with -- either plain "one package name per line" or the output
	// of `dpkg -l` / `dpkg-query -W`. When set, wear() reconciles the
	// system against it after the regular install steps: anything in the
	// manifest that's missing gets installed, and anything installed on
	// the system that is NOT in the manifest gets purged (except for a
	// small hardcoded set of packages that are never safe to remove,
	// e.g. the currently running kernel). This is what makes a wardrobe
	// authoritative/declarative instead of purely additive.
	PackagesManifest string `yaml:"packages_manifest"`
	PackagesNoRecommends []string `yaml:"-"`
	// Popolato da normalize() a partire da Sequence.PackagesInteractive.
	// These packages are installed without DEBIAN_FRONTEND=noninteractive
	// so the user can respond to license prompts and debconf questions.
	PackagesInteractive []string `yaml:"-"`
	// Populated from Sequence.PackagesRemove.
	// Removed after all packages are installed.
	PackagesRemove []string `yaml:"-"`
}

// Sequence raccoglie repository, pacchetti e accessori nella forma annidata.
type Sequence struct {
	Repositories                *Repositories `yaml:"repositories"`
	Packages                    []string      `yaml:"packages"`
	PackagesNoInstallRecommends []string      `yaml:"packages_no_install_recommends"`
	PackagesInteractive         []string      `yaml:"packages_interactive"`
	PackagesRemove              []string      `yaml:"packages_remove"`
	Accessories                 []string      `yaml:"accessories"`
	Cmds                        []string      `yaml:"cmds"`
}

// Repositories descrive le modifiche alle sorgenti apt prima dell'installazione.
type Repositories struct {
	SourcesList  []string `yaml:"sources_list"`   // componenti da abilitare: main, contrib, non-free...
	SourcesListD []string `yaml:"sources_list_d"` // comandi shell letterali (aggiunta repo di terze parti)
	Update       bool     `yaml:"update"`
	Upgrade      bool     `yaml:"upgrade"`
}

// Finalize raccoglie i comandi eseguiti a fine costume nella forma annidata.
type Finalize struct {
	Customize bool     `yaml:"customize"`
	Cmds      []string `yaml:"cmds"`
}

func (s *Suit) normalize() {
	if s.Sequence != nil {
		s.Packages = append(s.Packages, s.Sequence.Packages...)
		s.Accessories = append(s.Accessories, s.Sequence.Accessories...)
		s.Cmds = append(s.Cmds, s.Sequence.Cmds...)
		s.PackagesNoRecommends = append(s.PackagesNoRecommends, s.Sequence.PackagesNoInstallRecommends...)
		s.PackagesInteractive = append(s.PackagesInteractive, s.Sequence.PackagesInteractive...)
		s.PackagesRemove = append(s.PackagesRemove, s.Sequence.PackagesRemove...)
	}
	if s.Finalize != nil {
		s.Cmds = append(s.Cmds, s.Finalize.Cmds...)
	}
}
