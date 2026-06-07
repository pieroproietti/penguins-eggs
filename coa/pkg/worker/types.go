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

// Questa struct deve combaciare con la struttura del JSON generato per il task
type ActionMksquashfs struct {
	Name   string `json:"name"`
	Params struct {
		Algorithm    string `json:"algorithm"`
		Level        string `json:"level"`
		LiveRoot     string `json:"live_root"`
		DestFile     string `json:"dest_file"`
		ExcludesFile string `json:"excludes_file"`
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

// ActionXorriso mappa esattamente il payload JSON inviato dal tuo file YAML
type ActionXorriso struct {
	Name   string `json:"name"`
	Module string `json:"module"`
	Params struct {
		OutputFile  string `json:"output_file"`
		SourceDir   string `json:"source_dir"`
		Volid       string `json:"volid"`
		IsolinuxBin string `json:"isolinux_bin"`
		IsolinuxCat string `json:"isolinux_cat"`
		EfiImg      string `json:"efi_img"`
		Isohdpfx    string `json:"isohdpfx"`
	} `json:"params"`
}
