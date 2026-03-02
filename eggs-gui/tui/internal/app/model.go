package app

// Model holds the application state for the BubbleTea TUI.
// This follows the Elm Architecture: Model + Update + View.
type Model struct {
	// Current view/phase
	ActiveTab Tab

	// System info
	EggsVersion      string
	CalamaresVersion string
	DistroInfo       string
	DepsOK           bool

	// Terminal output buffer
	OutputLines []string
	MaxLines    int

	// Phase 1: Prepare
	PrepMode     PrepMode // Manual or Auto
	UpdateEggs   bool     // Update eggs + calamares

	// Phase 2: Configure
	CloneDesktop  bool
	CustomizeISO  bool

	// Phase 3: Produce
	IncludeData    bool
	MaxCompression bool

	// Produce options (from pengui)
	Prefix       string
	Basename     string
	Addons       string
	Theme        string
	Compression  string
	Clone        bool
	CryptedClone bool
	Script       bool
	Unsecure     bool
	Yolk         bool
	Excludes     []string

	// Status
	Running     bool
	Phase       string
	Progress    float64
	ElapsedSecs int

	// Wardrobe (from pengui)
	Costumes    []string
	Accessories []string
	Servers     []string

	// Window dimensions
	Width  int
	Height int

	// Error state
	Err error
}

// Tab represents the active view tab.
type Tab int

const (
	TabMain Tab = iota
	TabWardrobe
	TabConfig
	TabTools
)

// PrepMode represents the preparation mode.
type PrepMode int

const (
	PrepManual PrepMode = iota
	PrepAuto
)

// NewModel creates the initial application model.
func NewModel() Model {
	return Model{
		ActiveTab:   TabMain,
		PrepMode:    PrepManual,
		MaxLines:    100,
		OutputLines: make([]string, 0, 100),
		Compression: "fast",
		Theme:       "eggs",
	}
}

// AppendOutput adds a line to the terminal output buffer.
func (m *Model) AppendOutput(line string) {
	m.OutputLines = append(m.OutputLines, line)
	if len(m.OutputLines) > m.MaxLines {
		m.OutputLines = m.OutputLines[1:]
	}
}
