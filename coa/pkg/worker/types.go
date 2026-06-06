package worker

// ActionAutologinGui mappa il payload JSON inviato dal C per l'azione coa-autologin-gui
type ActionAutologinGui struct {
	Name               string `json:"name"`
	ResolvedTargetRoot string `json:"resolved_target_root"`

	// Mappiamo esattamente la struttura in arrivo da 'params'
	Params struct {
		Module string `json:"module"`
		User   string `json:"user"`
		IsGui  bool   `json:"is_gui"`
	} `json:"params"`
}

// Definiamo la struct con il flag Chroot
type ActionCopy struct {
	Name               string `json:"name"`
	ResolvedTargetRoot string `json:"resolved_target_root"`
	Chroot             bool   `json:"chroot"` // <-- IL PEZZO CHIAVE
	Params             struct {
		Module        string `json:"module"`
		Src           string `json:"src"`
		Dest          string `json:"dest"`
		IgnoreMissing bool   `json:"ignore_missing"`
		Permissions   int    `json:"permissions,omitempty"`
	} `json:"params"`
}

// Definiamo la struct con il flag Chroot
type ActionTemplate struct {
	Name               string `json:"name"`
	ResolvedTargetRoot string `json:"resolved_target_root"`
	Chroot             bool   `json:"chroot"` // <-- IL PEZZO CHIAVE PER I PATH
	Params             struct {
		Module      string            `json:"module"`
		Dest        string            `json:"dest"`
		Content     string            `json:"content"`
		Permissions int               `json:"permissions"`
		Vars        map[string]string `json:"vars,omitempty"`
	} `json:"params"`
}
