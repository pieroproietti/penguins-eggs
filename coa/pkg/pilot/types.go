package pilot

// Profile rappresenta la struttura completa del file YAML
type Profile struct {
	Remaster []Step `yaml:"remaster"`
	Install  []Step `yaml:"install"`
}

// Step è l'unità fondamentale del piano di lavoro.
// Rappresenta un'azione specifica definita nel profilo.
type Step struct {
	Name        string `yaml:"name" json:"name,omitempty"`
	Description string `yaml:"description" json:"description"`
	Action      string `yaml:"action" json:"action"` // Sostituisce Command per chiarezza semantica
	RunCommand  string `yaml:"run_command,omitempty" json:"run_command,omitempty"`
	Chroot      bool   `yaml:"chroot" json:"chroot"`
	Path        string `yaml:"path,omitempty" json:"path,omitempty"`
	Src         string `yaml:"src,omitempty" json:"src,omitempty"`
	Dst         string `yaml:"dst,omitempty" json:"dst,omitempty"`
	Users       []User `yaml:"users,omitempty" json:"users,omitempty"` // Supporto nativo per oa_users
}

// User definisce l'identità di un utente nel sistema live o installato
type User struct {
	Login    string   `yaml:"login" json:"login"`
	Password string   `yaml:"password" json:"password"`
	Home     string   `yaml:"home" json:"home"`
	Shell    string   `yaml:"shell" json:"shell"`
	Groups   []string `yaml:"groups" json:"groups"`
	UID      int      `yaml:"uid" json:"uid"`
	GID      int      `yaml:"gid" json:"gid"`
}

// TemplateContext definisce i dati che iniettiamo nei file .tmpl
type TemplateContext struct {
	Family         string
	DistroID       string
	IsGitHubAction bool
}

// Strutture per il mapping dell'indice
type BrainIndex struct {
	Distributions []DistroMap `yaml:"distributions"`
}

type DistroMap struct {
	ID   string   `yaml:"id"`
	Like []string `yaml:"like"`
	File string   `yaml:"file"`
}
