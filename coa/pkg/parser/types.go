package parser

// Profile rappresenta la struttura completa del file YAML
type Profile struct {
	Remaster []Step   `yaml:"remaster" json:"remaster"`
	Install  []Step   `yaml:"install" json:"install"`
	Settings Settings `yaml:"settings" json:"settings"`
}

// Step è l'unità fondamentale del piano di lavoro.
type Step struct {
	Name        string `yaml:"name" json:"name,omitempty"`
	Description string `yaml:"description,omitempty" json:"description,omitempty"`

	// I NUOVI STANDARD
	Module string                 `yaml:"module,omitempty" json:"module,omitempty"` // <-- Aggiunto omitempty
	Chroot bool                   `yaml:"chroot" json:"chroot"`                     // Nessun omitempty, di default è false ed è giusto così
	Params map[string]interface{} `yaml:"params,omitempty" json:"params,omitempty"`

	// DEPRECATED
	Action     string `yaml:"action,omitempty" json:"action,omitempty"` // <-- Aggiunto omitempty
	RunCommand string `yaml:"run_command,omitempty" json:"run_command,omitempty"`
	Path       string `yaml:"path,omitempty" json:"path,omitempty"`
	Src        string `yaml:"src,omitempty" json:"src,omitempty"`
	Dst        string `yaml:"dst,omitempty" json:"dst,omitempty"`
	Users      []User `yaml:"users,omitempty" json:"users,omitempty"`
}

// User definisce l'identità di un utente
type User struct {
	Login    string   `yaml:"login" json:"login"`
	Password string   `yaml:"password" json:"password"`
	Home     string   `yaml:"home" json:"home"`
	Shell    string   `yaml:"shell" json:"shell"`
	Groups   []string `yaml:"groups" json:"groups"`
	UID      int      `yaml:"uid" json:"uid"`
	GID      int      `yaml:"gid" json:"gid"`
}

// Strutture di Settings
type Settings struct {
	Remaster RemasterConfig `yaml:"remaster" json:"remaster" mapstructure:"remaster"`
}

type RemasterConfig struct {
	User        string            `yaml:"user" json:"user" mapstructure:"user"`
	Password    string            `yaml:"password" json:"password" mapstructure:"password"`
	WorkDir     string            `yaml:"work_dir" json:"work_dir" mapstructure:"work_dir"`
	Compression CompressionConfig `yaml:"compression" json:"compression" mapstructure:"compression"`
	ISOPrefix   string            `yaml:"iso_prefix,omitempty" json:"iso_prefix,omitempty" mapstructure:"iso_prefix"`
}

type CompressionConfig struct {
	Algorithm string `yaml:"algorithm" json:"algorithm" mapstructure:"algorithm"`
	Level     int    `yaml:"level" json:"level" mapstructure:"level"`
}

// TemplateContext e Index
type TemplateContext struct {
	Family         string
	DistroID       string
	IsGitHubAction bool
}

type BrainIndex struct {
	Distributions []DistroMap `yaml:"distributions"`
}

type DistroMap struct {
	ID   string   `yaml:"id"`
	Like []string `yaml:"like"`
	File string   `yaml:"file"`
}
