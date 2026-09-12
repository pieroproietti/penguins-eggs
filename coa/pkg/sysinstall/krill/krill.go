// File: krill/krill.go
package krill

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"

	"coa/pkg/distro"
	"coa/pkg/sysinstall/krill/engine"

	"github.com/charmbracelet/bubbles/progress"
	"github.com/charmbracelet/bubbles/spinner"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// isBasicTTY restituisce true quando il terminale non supporta Unicode
// (console Linux, TERM=dumb, ecc.).
func isBasicTTY() bool {
	term := os.Getenv("TERM")
	return term == "linux" || term == "dumb" || term == ""
}

// --- DEFINIZIONE DEGLI STATI ---
type appState int

const (
	StateWelcome appState = iota
	StateLocation
	StateKeyboard
	StateDisk
	StateUsers
	StateSummary
	StateInstall
)

// kbdLayouts sono i layout XKB proposti dal selettore; 'us' è il
// default sicuro, gli altri si raggiungono con ←/→.
var kbdLayouts = []string{
	"us", "it", "de", "fr", "es", "gb", "pt", "br", "latam", "ru",
	"pl", "nl", "be", "ch", "at", "se", "no", "fi", "dk", "cz",
	"sk", "hu", "ro", "tr", "gr", "ua", "jp",
}

// languages sono i locale UTF-8 proposti dal selettore Welcome;
// 'en_US.UTF-8' è il default sicuro, gli altri si raggiungono con ←/→.
var languages = []string{
	"en_US.UTF-8", "it_IT.UTF-8", "de_DE.UTF-8", "fr_FR.UTF-8", "es_ES.UTF-8",
	"pt_PT.UTF-8", "pt_BR.UTF-8", "nl_NL.UTF-8", "pl_PL.UTF-8", "ru_RU.UTF-8",
	"sv_SE.UTF-8", "nb_NO.UTF-8", "fi_FI.UTF-8", "da_DK.UTF-8", "cs_CZ.UTF-8",
	"sk_SK.UTF-8", "hu_HU.UTF-8", "ro_RO.UTF-8", "tr_TR.UTF-8", "el_GR.UTF-8",
	"uk_UA.UTF-8", "ja_JP.UTF-8", "zh_CN.UTF-8",
}

// Campi della schermata Users (gli indici 0..4 sono i textinput)
const (
	fieldFullname = iota
	fieldLogin
	fieldUserPass
	fieldRootPass
	fieldHostname
	fieldAutologin
	userFieldCount
)

// --- STILI ---
var (
	titleStyle     = lipgloss.NewStyle().Foreground(lipgloss.Color("#C59B27")).Bold(true).MarginBottom(1)
	cyanText       = lipgloss.NewStyle().Foreground(lipgloss.Color("#00FFFF"))
	greenText      = lipgloss.NewStyle().Foreground(lipgloss.Color("#00FF00"))
	redBgWhiteText = lipgloss.NewStyle().Background(lipgloss.Color("#FF0000")).Foreground(lipgloss.Color("#FFFFFF"))
	dimText        = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))

	// La larghezza reale viene impostata in View() sulla base del terminale
	// (tea.WindowSizeMsg); 75 è solo il minimo per non spezzare le scritte.
	windowStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			Height(11).
			Padding(0, 1)

	minWindowWidth = 75
)

// Messaggi dell'installazione reale: eventi di progresso e fine corsa.
type installEventMsg engine.Event
type installDoneMsg struct{ err error }

// --- IL MODELLO GLOBALE ---
type model struct {
	state appState
	cfg   *InstallerConfig

	// Dimensioni del terminale (aggiornate da tea.WindowSizeMsg)
	termWidth  int
	termHeight int

	// Globale
	appName     string
	productName string
	version     string

	// Welcome: selettore della lingua, indice in languages
	langIdx int
	arch    string

	// Keyboard: selettore del layout, 'us' come default sicuro
	kbdModel string
	kbdIdx   int

	// Network: dhcp (eredita dal live) o indirizzo statico editabile
	network   NetworkInfo
	netStatic bool
	netFocus  int               // 0 = selettore dhcp/static, 1.. = campi statici
	netInputs []textinput.Model // address, netmask, gateway, dns

	// Disk: selettori navigabili (↑/↓ campo, ←/→ valore)
	homeParts       []PartitionInfo
	homeIdx         int
	homeNamespace   string
	efiBootloaderID string
	debianEFI       bool
	diskError       string
	diskBios        string
	diskModes       []string
	diskModeIdx     int
	disks           []DiskInfo
	diskIdx         int
	candidateParts  []PartitionInfo
	partIdx         int
	efiParts        []PartitionInfo
	efiIdx          int
	fsTypes         []string
	fsIdx           int
	swapTypes       []string
	swapIdx         int
	diskField       int
	initialization  *coexistInitialization

	// Users: campi di testo editabili più il checkbox autologin
	userInputs []textinput.Model
	userFocus  int
	userAuto   bool

	// Location: selettori regione/zona (↑/↓ campo, ←/→ valore)
	locData      TimezoneData
	locRegionIdx int
	locZoneIdx   int
	locField     int // 0 = region, 1 = zone

	// Confirm
	confirmChoice int // 0 = No (default), 1 = Yes

	// Install (guidata dagli eventi dell'engine)
	installMsg  string
	percent     float64
	installCh   chan tea.Msg
	installDone bool
	installErr  error
	spinner     spinner.Model
	progress    progress.Model

	// Finished: stessa scelta della pagina finale di Calamares
	// (modules/finished.conf), riavviare o uscire semplicemente.
	restartEnabled bool
	restartChecked bool
	restartCommand string
}

// initialModel costruisce il modello a partire dalla configurazione
// generata dalla pipeline (la stessa di Calamares) e dal sistema live.
func initialModel(cfg *InstallerConfig, fstype string) model {
	s := spinner.New()
	if isBasicTTY() {
		s.Spinner = spinner.Line
	} else {
		s.Spinner = spinner.Dot
	}
	s.Style = lipgloss.NewStyle().Foreground(lipgloss.Color("205"))

	kbd := DetectKeyboard()
	region, zone := DetectTimezone()
	tzData := DetectTimezones()

	disks := DetectDisks()
	if len(disks) == 0 {
		disks = []DiskInfo{{Path: "/dev/sda", Size: "?"}}
	}

	fsTypes := cfg.Partition.AvailableFileSystemTypes
	if len(fsTypes) == 0 {
		fsTypes = []string{"ext4"}
	}
	if fstype != "" {
		found := false
		for _, ft := range fsTypes {
			if ft == fstype {
				found = true
				break
			}
		}
		if !found {
			fsTypes = append(fsTypes, fstype)
		}
	}

	swapTypes := cfg.Partition.UserSwapChoices
	if len(swapTypes) == 0 {
		swapTypes = []string{"none", "small", "suspend", "file"}
	}

	diskModes := []string{"Erase disk", "Replace a partition", "Coexist with existing installations"}
	diskModeIdx := 0

	var candidateParts []PartitionInfo
	var efiParts []PartitionInfo
	if len(disks) > 0 {
		allParts := DetectPartitions(disks[0].Path)
		candidateParts = GetCandidatePartitions(allParts, DetectLiveDisk())
		efiParts = GetEfiPartitions(allParts)
		if len(efiParts) == 0 && cfg.FirmwareLabel() == "UEFI" {
			efiParts = DetectAllEfiPartitions()
		}
	}

	inputs := make([]textinput.Model, 5)
	for i := range inputs {
		inputs[i] = textinput.New()
		inputs[i].Prompt = ""
		inputs[i].CharLimit = 64
		inputs[i].Width = 30
	}
	// "artisan"/"evolution" è l'utente proposto di default: quello del
	// sistema live (es. "live") non ha senso come account permanente.
	inputs[fieldFullname].SetValue("artisan")
	inputs[fieldLogin].SetValue("artisan")
	inputs[fieldUserPass].EchoMode = textinput.EchoPassword
	inputs[fieldUserPass].SetValue(UnattendedPassword)
	inputs[fieldRootPass].EchoMode = textinput.EchoPassword
	inputs[fieldRootPass].Placeholder = "empty = same as user"
	inputs[fieldHostname].SetValue(cfg.DefaultHostname())

	network := DetectNetwork()
	netInputs := make([]textinput.Model, 4)
	for i := range netInputs {
		netInputs[i] = textinput.New()
		netInputs[i].Prompt = ""
		netInputs[i].CharLimit = 40
		netInputs[i].Width = 22
	}
	netInputs[0].SetValue(network.Address)
	netInputs[1].SetValue(orDefault(network.Netmask, "255.255.255.0"))
	netInputs[2].SetValue(network.Gateway)
	netInputs[3].SetValue(orDefault(network.Dns, "8.8.8.8"))

	return model{
		state:       StateWelcome,
		debianEFI:   distro.NewDistro().FamilyID == "debian",
		cfg:         cfg,
		appName:     "krill",
		productName: orDefault(cfg.Branding.Strings.ProductName, "Linux"),
		version:     orDefault(cfg.Branding.Strings.Version, "n/a"),

		langIdx: indexOf(languages, DetectLanguage()),
		arch:    runtime.GOARCH,

		kbdModel: kbd.Model,
		kbdIdx:   0, // kbdLayouts[0] = "us", il default voluto

		network:   network,
		netInputs: netInputs,

		diskBios:       cfg.FirmwareLabel(),
		diskModes:      diskModes,
		diskModeIdx:    diskModeIdx,
		disks:          disks,
		diskIdx:        0,
		candidateParts: candidateParts,
		partIdx:        0,
		efiParts:       efiParts,
		efiIdx:         0,
		fsTypes:        fsTypes,
		fsIdx:          indexOf(fsTypes, orDefault(orDefault(fstype, cfg.Partition.DefaultFileSystemType), "ext4")),
		swapTypes:      swapTypes,
		swapIdx:        indexOf(swapTypes, orDefault(cfg.Partition.InitialSwapChoice, "none")),

		userInputs: inputs,
		userFocus:  fieldFullname,
		userAuto:   true,

		locData:      tzData,
		locRegionIdx: indexOf(tzData.Regions, region),
		locZoneIdx:   indexOfZone(tzData, region, zone),

		installMsg: "Starting installation...",
		percent:    0.0,
		spinner:    s,
		progress:   progress.New(progress.WithSolidFill("#C59B27")),

		restartEnabled: cfg.Finished.RestartNowEnabled,
		restartChecked: cfg.Finished.RestartNowChecked,
		restartCommand: orDefault(cfg.Finished.RestartNowCommand, "reboot"),
	}
}

// orDefault restituisce fallback quando value è vuoto.
func orDefault(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

// --- INIT ---
func (m model) Init() tea.Cmd {
	return tea.Batch(m.spinner.Tick, textinput.Blink)
}

// --- UPDATE ---
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	case tea.WindowSizeMsg:
		m.termWidth = msg.Width
		m.termHeight = msg.Height
		// La barra di avanzamento segue la finestra: togliamo lo spazio
		// di bordi, padding ed etichetta percentuale.
		if barWidth := msg.Width - 10; barWidth > 20 {
			m.progress.Width = barWidth
		}

	case tea.KeyMsg:
		key := msg.String()
		if m.state == StateDisk && m.initialization != nil {
			return m.updateCoexistInitialization(msg)
		}

		// Ctrl+C è l'unica scorciatoia per uscire, ovunque: 'q' resta
		// un carattere digitabile nei campi di testo (Users, Network).
		if key == "ctrl+c" {
			return m, tea.Quit
		}

		switch m.state {
		case StateWelcome:
			return m.updateWelcome(key)
		case StateLocation:
			return m.updateLocation(key)
		case StateKeyboard:
			return m.updateKeyboard(key)
		case StateDisk:
			fields := m.activeDiskFields()
			if m.diskField >= 0 && m.diskField < len(fields) && (fields[m.diskField] == diskFieldNamespace || fields[m.diskField] == diskFieldEFIID) && msg.Type == tea.KeyRunes {
				for _, ch := range msg.Runes {
					next, _ := m.updateDisk(string(ch))
					m = next.(model)
				}
				return m, nil
			}
			return m.updateDisk(key)
		case StateUsers:
			return m.updateUsers(msg)
		case StateSummary:
			return m.updateSummary(key)
		default:
			switch key {
			case "enter":
				if m.state == StateInstall {
					if m.installDone {
						if m.installErr == nil && m.restartEnabled && m.restartChecked {
							return m, runRestart(m.restartCommand)
						}
						return m, tea.Quit
					}
				}
			case " ":
				if m.state == StateInstall && m.installDone && m.installErr == nil && m.restartEnabled {
					m.restartChecked = !m.restartChecked
				}
			}
		}

	case coexistPreviewMsg:
		return m.receiveCoexistPreview(msg)
	case coexistInitializedMsg:
		return m.receiveCoexistInitialization(msg)
	case installEventMsg:
		m.installMsg = msg.Message
		if msg.Total > 0 {
			m.percent = float64(msg.Index) / float64(msg.Total)
		}
		return m, waitInstall(m.installCh)

	case installDoneMsg:
		m.installDone = true
		m.installErr = msg.err
		if msg.err == nil {
			m.percent = 1.0
			m.installMsg = "Installation Complete!"
		} else {
			m.installMsg = msg.err.Error()
		}
		return m, nil

	case spinner.TickMsg:
		var cmd tea.Cmd
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd
	}

	return m, nil
}

// updateWelcome gestisce il selettore della lingua nella schermata iniziale.
func (m model) updateWelcome(key string) (tea.Model, tea.Cmd) {
	switch key {
	case "left":
		m.langIdx = cycle(m.langIdx, -1, len(languages))
	case "right":
		m.langIdx = cycle(m.langIdx, 1, len(languages))
	case "enter":
		m.state = StateLocation
	}
	return m, nil
}

// updateLocation gestisce i selettori di regione e zona.
func (m model) updateLocation(key string) (tea.Model, tea.Cmd) {
	switch key {
	case "up", "shift+tab":
		m.locField = cycle(m.locField, -1, 2)
	case "down", "tab":
		m.locField = cycle(m.locField, 1, 2)
	case "left", "right":
		delta := 1
		if key == "left" {
			delta = -1
		}
		switch m.locField {
		case 0:
			m.locRegionIdx = cycle(m.locRegionIdx, delta, len(m.locData.Regions))
			m.locZoneIdx = 0
		case 1:
			zones := m.locData.Zones[m.selectedRegion()]
			if len(zones) > 0 {
				m.locZoneIdx = cycle(m.locZoneIdx, delta, len(zones))
			}
		}
	case "enter":
		m.state = StateKeyboard
	}
	return m, nil
}

// updateKeyboard gestisce il selettore del layout di tastiera.
func (m model) updateKeyboard(key string) (tea.Model, tea.Cmd) {
	switch key {
	case "left":
		m.kbdIdx = cycle(m.kbdIdx, -1, len(kbdLayouts))
	case "right":
		m.kbdIdx = cycle(m.kbdIdx, 1, len(kbdLayouts))
	case "enter":
		m.state = StateDisk
	}
	return m, nil
}

// updateNetwork gestisce il selettore dhcp/static e i campi statici.
func (m model) updateNetwork(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "enter":
		m.state = StateDisk
		return m, nil
	case "tab", "down":
		return m, m.focusNet(m.netFocus + 1)
	case "shift+tab", "up":
		return m, m.focusNet(m.netFocus - 1)
	case "left", "right":
		if m.netFocus == 0 {
			m.netStatic = !m.netStatic
			if !m.netStatic {
				return m, m.focusNet(0)
			}
			return m, nil
		}
	}
	if m.netStatic && m.netFocus > 0 {
		i := m.netFocus - 1
		var cmd tea.Cmd
		m.netInputs[i], cmd = m.netInputs[i].Update(msg)
		return m, cmd
	}
	return m, nil
}

// focusNet sposta il focus tra i campi della schermata Network.
// Con dhcp l'unico campo raggiungibile è il selettore.
func (m *model) focusNet(idx int) tea.Cmd {
	count := 1
	if m.netStatic {
		count = 1 + len(m.netInputs)
	}
	m.netFocus = cycle(idx, 0, count)
	var cmd tea.Cmd
	for i := range m.netInputs {
		if m.netStatic && m.netFocus == i+1 {
			cmd = m.netInputs[i].Focus()
		} else {
			m.netInputs[i].Blur()
		}
	}
	return cmd
}

func (m *model) refreshPartitions() {
	if len(m.disks) == 0 || m.diskIdx >= len(m.disks) {
		m.candidateParts = nil
		m.efiParts = nil
		m.partIdx = 0
		m.efiIdx = 0
		return
	}
	allParts := DetectPartitions(m.disks[m.diskIdx].Path)
	m.candidateParts = GetCandidatePartitions(allParts, DetectLiveDisk())
	m.efiParts = GetEfiPartitions(allParts)
	if len(m.efiParts) == 0 && (m.diskBios == "UEFI" || (m.diskModeIdx == 2 && engine.IsUEFI())) {
		m.efiParts = DetectAllEfiPartitions()
	}
	m.partIdx = 0
	m.efiIdx = 0
	if m.diskModeIdx == 2 {
		m.efiParts = coexistEfiPartitions(m.efiParts)
		m.partIdx, m.efiIdx, m.homeIdx = -1, -1, -1
		m.homeParts = nil
		for _, disk := range m.disks {
			for _, part := range DetectPartitions(disk.Path) {
				if part.FsType == "ext4" && !part.IsEfi {
					m.homeParts = append(m.homeParts, part)
				}
			}
		}
	}
}

func coexistEfiPartitions(parts []PartitionInfo) []PartitionInfo {
	var result []PartitionInfo
	for _, part := range parts {
		if engine.IsCoexistESP(part.PartType, part.FsType) {
			result = append(result, part)
		}
	}
	return result
}

type diskFieldKind int

const (
	diskFieldMode diskFieldKind = iota
	diskFieldDevice
	diskFieldTargetPart
	diskFieldEfi
	diskFieldHome
	diskFieldNamespace
	diskFieldEFIID
	diskFieldFs
	diskFieldSwap
	diskFieldInitialize
)

func (m *model) activeDiskFields() []diskFieldKind {
	if m.diskModeIdx == 0 {
		return []diskFieldKind{diskFieldMode, diskFieldDevice, diskFieldFs, diskFieldSwap}
	}
	fields := []diskFieldKind{diskFieldMode, diskFieldDevice, diskFieldTargetPart}
	if m.diskModeIdx == 2 || (m.diskBios == "UEFI" && len(m.efiParts) > 1) {
		fields = append(fields, diskFieldEfi)
	}
	if m.diskModeIdx == 2 {
		fields = append(fields, diskFieldHome, diskFieldNamespace)
		if m.debianEFI {
			fields = append(fields, diskFieldEFIID)
		}
	}
	fields = append(fields, diskFieldFs, diskFieldSwap)
	if m.diskModeIdx == 2 {
		fields = append(fields, diskFieldInitialize)
	}
	return fields
}

func (m *model) availableSwapTypes() []string {
	if m.diskModeIdx == 1 || m.diskModeIdx == 2 {
		return []string{"none", "file"}
	}
	return m.swapTypes
}

// updateDisk naviga i selettori della schermata Disk.
func (m model) updateDisk(key string) (tea.Model, tea.Cmd) {
	activeFields := m.activeDiskFields()
	if m.diskField >= len(activeFields) {
		m.diskField = len(activeFields) - 1
	}
	if activeFields[m.diskField] == diskFieldInitialize && key == "enter" {
		return m.startCoexistPreview(PreviewCoexistInitialization)
	}

	if activeFields[m.diskField] == diskFieldNamespace || activeFields[m.diskField] == diskFieldEFIID {
		value := &m.homeNamespace
		if activeFields[m.diskField] == diskFieldEFIID {
			value = &m.efiBootloaderID
		}
		switch key {
		case "backspace", "ctrl+h":
			if len(*value) > 0 {
				*value = (*value)[:len(*value)-1]
			}
			return m, nil
		case "up", "down", "tab", "shift+tab", "enter", "left", "right":
		default:
			if len(key) == 1 && len(*value)+len(key) <= 64 {
				valid := key != ""
				for _, ch := range key {
					if !(ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z' || ch >= '0' && ch <= '9' || ch == '-' || ch == '_') {
						valid = false
					}
				}
				if valid {
					*value += key
				}
			}
			return m, nil
		}
	}
	switch key {
	case "up", "shift+tab":
		m.diskField = cycle(m.diskField, -1, len(activeFields))
	case "down", "tab":
		m.diskField = cycle(m.diskField, 1, len(activeFields))
	case "left", "right":
		delta := 1
		if key == "left" {
			delta = -1
		}
		currentKind := activeFields[m.diskField]
		switch currentKind {
		case diskFieldMode:
			m.diskModeIdx = cycle(m.diskModeIdx, delta, len(m.diskModes))
			m.refreshPartitions()
			if m.diskField >= len(m.activeDiskFields()) {
				m.diskField = 0
			}
		case diskFieldDevice:
			m.diskIdx = cycle(m.diskIdx, delta, len(m.disks))
			m.refreshPartitions()
		case diskFieldTargetPart:
			if len(m.candidateParts) > 0 {
				m.partIdx = cycle(m.partIdx, delta, len(m.candidateParts))
			}
		case diskFieldEfi:
			if len(m.efiParts) > 0 {
				m.efiIdx = cycle(m.efiIdx, delta, len(m.efiParts))
			}
		case diskFieldHome:
			if len(m.homeParts) > 0 {
				m.homeIdx = cycle(m.homeIdx, delta, len(m.homeParts))
			}
		case diskFieldFs:
			m.fsIdx = cycle(m.fsIdx, delta, len(m.fsTypes))
		case diskFieldSwap:
			swaps := m.availableSwapTypes()
			m.swapIdx = cycle(m.swapIdx, delta, len(swaps))
		}
	case "enter":
		m.diskError = ""
		if m.diskModeIdx == 2 {
			if !engine.IsUEFI() {
				m.diskError = "Coexist requires the live system to be booted in UEFI mode."
			} else if m.partIdx < 0 || m.efiIdx < 0 || m.homeIdx < 0 || len(m.candidateParts) == 0 || len(m.efiParts) == 0 || len(m.homeParts) == 0 {
				m.diskError = "Explicitly select the root to FORMAT and both EFI and shared HOME to PRESERVE."
			}
			if err := engine.ValidateHomeNamespace(m.homeNamespace); err != nil && m.diskError == "" {
				m.diskError = err.Error()
			}
			if m.debianEFI && m.diskError == "" {
				if err := engine.ValidateEFIBootloaderID(m.efiBootloaderID); err != nil {
					m.diskError = err.Error()
				}
			}
			if m.diskError != "" {
				return m, nil
			}
		}
		if m.diskModeIdx == 1 && len(m.candidateParts) == 0 {
			// Non possiamo proseguire se non c'è una partizione valida da sostituire
			return m, nil
		}
		m.state = StateUsers
		return m, m.focusUser(fieldFullname)
	}
	return m, nil
}

// updateUsers gestisce i campi di testo e il checkbox autologin.
func (m model) updateUsers(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "enter":
		m.state = StateSummary
		m.confirmChoice = 0
		return m, nil
	case "tab", "down":
		return m, m.focusUser(m.userFocus + 1)
	case "shift+tab", "up":
		return m, m.focusUser(m.userFocus - 1)
	case " ":
		if m.userFocus == fieldAutologin {
			m.userAuto = !m.userAuto
			return m, nil
		}
	}
	if m.userFocus < len(m.userInputs) {
		var cmd tea.Cmd
		m.userInputs[m.userFocus], cmd = m.userInputs[m.userFocus].Update(msg)
		return m, cmd
	}
	return m, nil
}

// updateSummary gestisce la navigazione e la conferma finale nella schermata Summary.
func (m model) updateSummary(key string) (tea.Model, tea.Cmd) {
	switch key {
	case "left", "right", "tab", "shift+tab", "up", "down":
		m.confirmChoice = 1 - m.confirmChoice
	case "esc":
		m.state = StateWelcome
		return m, nil
	case "enter":
		if m.confirmChoice == 1 {
			if m.userInputs[fieldLogin].Value() == "" || m.userInputs[fieldUserPass].Value() == "" {
				m.state = StateUsers
				return m, m.focusUser(fieldUserPass)
			}
			m.state = StateInstall
			return m, m.startInstall()
		}
		// Se si seleziona NO, torna indietro alla prima fase (Welcome)
		m.state = StateWelcome
		return m, nil
	}
	return m, nil
}

// focusUser sposta il focus tra i campi della schermata Users.
// Nota: muta i textinput in place, per questo il receiver è un puntatore.
func (m *model) focusUser(idx int) tea.Cmd {
	m.userFocus = cycle(idx, 0, userFieldCount)
	var cmd tea.Cmd
	for i := range m.userInputs {
		if i == m.userFocus {
			cmd = m.userInputs[i].Focus()
		} else {
			m.userInputs[i].Blur()
		}
	}
	return cmd
}

// cycle incrementa idx di delta restando nell'intervallo [0, n).
func cycle(idx, delta, n int) int {
	return (idx + delta + n) % n
}

// indexOf restituisce la posizione di value in list, 0 se assente.
func indexOf(list []string, value string) int {
	for i, v := range list {
		if v == value {
			return i
		}
	}
	return 0
}

// indexOfZone restituisce la posizione di zone nella regione data, 0 se assente.
func indexOfZone(td TimezoneData, region, zone string) int {
	return indexOf(td.Zones[region], zone)
}

// selectedRegion restituisce la regione correntemente selezionata.
func (m *model) selectedRegion() string {
	return m.locData.Regions[m.locRegionIdx]
}

// selectedZone restituisce la zona correntemente selezionata.
func (m *model) selectedZone() string {
	zones := m.locData.Zones[m.selectedRegion()]
	if len(zones) == 0 {
		return ""
	}
	return zones[m.locZoneIdx]
}

// --- VIEW GLOBALE ---
func (m model) View() string {
	title := titleStyle.Render("KRILL TUI SYSTEM INSTALLER")

	var insideBox string
	switch m.state {
	case StateWelcome:
		insideBox = m.viewWelcome()
	case StateLocation:
		insideBox = m.viewLocation()
	case StateKeyboard:
		insideBox = m.viewKeyboard()
	case StateDisk:
		insideBox = m.viewDisk()
	case StateUsers:
		insideBox = m.viewUsers()
	case StateSummary:
		insideBox = m.viewSummary()
	case StateInstall:
		insideBox = m.viewInstall()
	}

	// Massimizziamo la finestra sulla larghezza del terminale
	// (il bordo occupa 2 colonne), senza scendere sotto il minimo.
	width := m.termWidth - 2
	if width < minWindowWidth {
		width = minWindowWidth
	}
	mainWindow := windowStyle.Width(width).Render(insideBox)
	finalView := lipgloss.JoinVertical(lipgloss.Center, title, mainWindow)

	footer := "\nPress Ctrl+C to quit."
	if m.initialization != nil {
		footer = "\nDisk preparation only; installation will not start automatically."
	} else if m.state == StateSummary {
		footer = "\n←/→ select option | Press 'Enter' to confirm."
	} else if m.state != StateInstall {
		footer += " | Press 'Enter' to continue."
	} else if !m.installDone {
		footer = "\nInstallation in progress — do not power off."
	} else if m.installErr == nil && m.restartEnabled {
		footer = "\nPress 'space' to toggle restart now | Press 'Enter' to finish."
	} else {
		footer = "\nPress 'Enter' to finish."
	}

	return "\n" + finalView + "\n" + footer + "\n"
}

// --- HELPER PER LA BARRA DEGLI STEP ---
// Tab orizzontale sopra il contenuto: con un terminale 80x24 una colonna
// laterale toglie troppo spazio utile, una riga in alto no.
func renderSteps(currentStep int) string {
	steps := []string{"Welcome", "Location", "Keyboard", "Disk", "Users", "Summary", "Install"}
	var renderedSteps []string
	for i, step := range steps {
		if i+1 == currentStep {
			renderedSteps = append(renderedSteps, cyanText.Render(step))
		} else {
			renderedSteps = append(renderedSteps, dimText.Render(step))
		}
	}
	tabs := strings.Join(renderedSteps, "  ")
	rule := dimText.Render(strings.Repeat("─", lipgloss.Width(tabs)))
	return lipgloss.JoinVertical(lipgloss.Left, tabs, rule)
}

// --- COMPONENTI ---
func (m model) viewWelcome() string {
	stepsView := renderSteps(1)
	welcomeText := fmt.Sprintf("Welcome to %s system installer\n\n", m.appName)
	installingText := fmt.Sprintf("We are installing\nLinux %s version %s\non %s\n\n", cyanText.Render(m.productName), cyanText.Render(m.version), cyanText.Render(m.arch))
	langText := fmt.Sprintf("%sLanguage: %s", cyanText.Render("→ "), cyanText.Render("‹ "+languages[m.langIdx]+" ›"))
	help := "\n←/→ change language"
	mainContent := lipgloss.JoinVertical(lipgloss.Left, welcomeText, installingText, langText, help)
	return lipgloss.JoinVertical(lipgloss.Left, stepsView, "", mainContent)
}

func (m model) viewLocation() string {
	stepsView := renderSteps(2)
	region := m.selectedRegion()
	zone := m.selectedZone()

	row1 := m.locationRow(0, "Region", region)
	row2 := m.locationRow(1, "Zone", zone)
	help := "\n↑/↓ select field | ←/→ change value"

	mainContent := lipgloss.JoinVertical(lipgloss.Left, row1, row2, help)
	return lipgloss.JoinVertical(lipgloss.Left, stepsView, "", mainContent)
}

func (m model) locationRow(field int, label, value string) string {
	marker := "  "
	if m.locField == field {
		marker = cyanText.Render("→ ")
	}
	return fmt.Sprintf("%s%-10s: %s", marker, label, cyanText.Render("‹ "+value+" ›"))
}

func (m model) viewKeyboard() string {
	stepsView := renderSteps(3)
	modelTxt := fmt.Sprintf("  Model : %s", cyanText.Render(m.kbdModel))
	layoutTxt := fmt.Sprintf("%sLayout: %s", cyanText.Render("→ "), cyanText.Render("‹ "+kbdLayouts[m.kbdIdx]+" ›"))
	help := "\n←/→ change layout ('us' is the safe default)"
	mainContent := lipgloss.JoinVertical(lipgloss.Left, modelTxt, layoutTxt, help)
	return lipgloss.JoinVertical(lipgloss.Left, stepsView, "", mainContent)
}

func (m model) viewNetwork() string {
	stepsView := renderSteps(4)
	n := m.network

	typeVal := "dhcp"
	if m.netStatic {
		typeVal = "static"
	}
	typeMarker := "  "
	if m.netFocus == 0 {
		typeMarker = cyanText.Render("→ ")
	}

	rows := []string{
		fmt.Sprintf("  %-10s: %s", "interface", greenText.Render(orDefault(n.Iface, "eth0"))),
		fmt.Sprintf("%s%-10s: %s", typeMarker, "type", cyanText.Render("‹ "+typeVal+" ›")),
	}

	if m.netStatic {
		labels := []string{"address", "netmask", "gateway", "dns"}
		for i, label := range labels {
			marker := "  "
			if m.netFocus == i+1 {
				marker = cyanText.Render("→ ")
			}
			rows = append(rows, fmt.Sprintf("%s%-10s: %s", marker, label, m.netInputs[i].View()))
		}
		rows = append(rows, "\n↑/↓ move between fields | type to edit")
	} else {
		rows = append(rows,
			fmt.Sprintf("  %-10s: %s", "address", greenText.Render(orDefault(n.Address, "n/a"))),
			fmt.Sprintf("  %-10s: %s", "dns", greenText.Render(orDefault(n.Dns, "n/a"))),
			"\nDetected from the live system: the installed system will inherit it.",
			"←/→ on 'type' to switch to a static address")
	}

	mainContent := lipgloss.JoinVertical(lipgloss.Left, rows...)
	return lipgloss.JoinVertical(lipgloss.Left, stepsView, "", mainContent)
}

func (m model) viewDisk() string {
	if m.initialization != nil {
		return m.viewCoexistInitialization()
	}
	stepsView := renderSteps(4)

	activeFields := m.activeDiskFields()
	device := m.disks[m.diskIdx]

	firmware := m.diskBios
	if m.diskModeIdx == 2 {
		firmware = "BIOS"
		if engine.IsUEFI() {
			firmware = "UEFI"
		}
	}
	rowFirmware := fmt.Sprintf("Firmware: %s", cyanText.Render(firmware))

	var rows []string
	rows = append(rows, rowFirmware, "")

	for idx, kind := range activeFields {
		isActive := (idx == m.diskField)
		switch kind {
		case diskFieldMode:
			rows = append(rows, m.selectorRow(isActive, "Installation mode", m.diskModes[m.diskModeIdx]))
		case diskFieldDevice:
			rows = append(rows, m.selectorRow(isActive, "Installation device", fmt.Sprintf("%s (%s)", device.Path, device.Size)))
		case diskFieldInitialize:
			rows = append(rows, m.selectorRow(isActive, "Initialize disk for Coexist", "Enter to review destructive preparation"))
		case diskFieldTargetPart:
			partStr := "none available"
			if len(m.candidateParts) > 0 && m.partIdx >= 0 {
				partStr = m.candidateParts[m.partIdx].DisplayString()
			}
			rows = append(rows, m.selectorRow(isActive, "Target partition", partStr))
			if m.diskModeIdx != 2 && m.diskBios == "UEFI" && len(m.efiParts) == 1 {
				rows = append(rows, fmt.Sprintf("  %-20s: %s %s", "EFI System Partition",
					greenText.Render(m.efiParts[0].Path+" ("+m.efiParts[0].Size+")"),
					dimText.Render("[auto-detected, preserved]")))
			} else if m.diskBios == "UEFI" && len(m.efiParts) == 0 {
				rows = append(rows, fmt.Sprintf("  %-20s: %s", "EFI System Partition",
					redBgWhiteText.Render(" none detected ")))
			}
		case diskFieldEfi:
			efiStr := "none"
			if len(m.efiParts) > 0 && m.efiIdx >= 0 {
				efiStr = m.efiParts[m.efiIdx].Path + " (" + m.efiParts[m.efiIdx].Size + ")"
			}
			rows = append(rows, m.selectorRow(isActive, "EFI System Partition", efiStr))
		case diskFieldHome:
			part := "SELECT SHARED HOME (ext4)"
			if m.homeIdx >= 0 && m.homeIdx < len(m.homeParts) {
				part = m.homeParts[m.homeIdx].DisplayString()
			}
			rows = append(rows, m.selectorRow(isActive, "Shared HOME (preserve)", part))
		case diskFieldNamespace:
			rows = append(rows, m.selectorRow(isActive, "HOME namespace (type)", m.homeNamespace))
		case diskFieldEFIID:
			rows = append(rows, m.selectorRow(isActive, "EFI bootloader ID (type)", m.efiBootloaderID))
		case diskFieldFs:
			rows = append(rows, m.selectorRow(isActive, "Filesystem", m.fsTypes[m.fsIdx]))
		case diskFieldSwap:
			swaps := m.availableSwapTypes()
			swapVal := "none"
			if m.swapIdx < len(swaps) {
				swapVal = swaps[m.swapIdx]
			}
			rows = append(rows, m.selectorRow(isActive, "User swap choice", swapVal))
		}
	}

	help := "\n↑/↓ select field | ←/→ change value"
	rows = append(rows, help, "")
	if m.diskModeIdx == 2 {
		rows = append(rows, m.coexistResources(), redBgWhiteText.Render(m.diskError))
	}

	if m.diskModeIdx == 0 {
		warning1 := "(*) this will erase all data currently present on the"
		warning2 := "installation device: " + device.Path
		rows = append(rows, lipgloss.JoinVertical(lipgloss.Left, redBgWhiteText.Render(warning1), redBgWhiteText.Render(warning2)))
	} else {
		targetPath := "selected partition"
		if len(m.candidateParts) > 0 && m.partIdx >= 0 {
			targetPath = m.candidateParts[m.partIdx].Path
		}
		warningStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#FFA500")).Bold(true)
		w1 := fmt.Sprintf("(*) this will FORMAT and ERASE only partition: %s", targetPath)
		w2 := fmt.Sprintf("    all other partitions on %s will NOT be touched.", device.Path)
		if m.diskModeIdx == 2 {
			w2 = "ESP filesystem is preserved; existing bootloader installation behavior still applies."
			if m.debianEFI {
				w2 = "GRUB uses the selected EFI bootloader ID and preserves EFI/BOOT."
			}
		}
		rows = append(rows, lipgloss.JoinVertical(lipgloss.Left, warningStyle.Render(w1), dimText.Render(w2)))
		if len(m.candidateParts) == 0 {
			noPartWarn := redBgWhiteText.Render(" ⚠️  No candidate partition found on this disk (must be >= 4G and not live/EFI) ")
			rows = append(rows, "", noPartWarn)
		}
	}

	mainContent := lipgloss.JoinVertical(lipgloss.Left, rows...)
	return lipgloss.JoinVertical(lipgloss.Left, stepsView, "", mainContent)
}

// selectorRow disegna un campo a scelta multipla della schermata Disk,
// evidenziando quello su cui si trova il focus.
func (m model) selectorRow(active bool, label, value string) string {
	marker := "  "
	if active {
		marker = cyanText.Render("→ ")
	}
	return fmt.Sprintf("%s%-20s: %s", marker, label, cyanText.Render("‹ "+value+" ›"))
}

func (m model) viewUsers() string {
	stepsView := renderSteps(5)

	labels := []string{"fullname", "login", "user password", "root password", "hostname"}
	var rows []string
	for i, label := range labels {
		marker := "  "
		if m.userFocus == i {
			marker = cyanText.Render("→ ")
		}
		rows = append(rows, fmt.Sprintf("%s%-13s: %s", marker, label, m.userInputs[i].View()))
	}

	checkbox := "[x]"
	if !m.userAuto {
		checkbox = "[ ]"
	}
	marker := "  "
	if m.userFocus == fieldAutologin {
		marker = cyanText.Render("→ ")
	}
	rows = append(rows, fmt.Sprintf("%s%s autologin (space to toggle)", marker, cyanText.Render(checkbox)))
	rows = append(rows, "\n↑/↓ move between fields | type to edit")

	mainContent := lipgloss.JoinVertical(lipgloss.Left, rows...)
	return lipgloss.JoinVertical(lipgloss.Left, stepsView, "", mainContent)
}

func (m model) viewSummary() string {
	stepsView := renderSteps(6)

	login := m.userInputs[fieldLogin].Value()
	hostname := m.userInputs[fieldHostname].Value()
	device := m.disks[m.diskIdx]
	swaps := m.availableSwapTypes()
	swapVal := "none"
	if m.swapIdx < len(swaps) {
		swapVal = swaps[m.swapIdx]
	}

	row1 := fmt.Sprintf("Installing %s", greenText.Render(m.productName))
	row2 := fmt.Sprintf("User %s pwd %s root pwd %s hostname %s",
		greenText.Render(login),
		greenText.Render(maskPassword(m.userInputs[fieldUserPass].Value())),
		greenText.Render(maskPassword(m.userInputs[fieldRootPass].Value())),
		greenText.Render(hostname))
	row3 := fmt.Sprintf("Set timezone to %s/%s", greenText.Render(m.selectedRegion()), greenText.Render(m.selectedZone()))
	row4 := fmt.Sprintf("The system language will be set to %s", greenText.Render(languages[m.langIdx]))
	row5 := fmt.Sprintf("Numbers and date locale will be set to %s", greenText.Render(languages[m.langIdx]))
	row6 := fmt.Sprintf("Set keyboard model to %s layout %s", greenText.Render(m.kbdModel), greenText.Render(kbdLayouts[m.kbdIdx]))
	rowMode := fmt.Sprintf("Installation mode: %s", greenText.Render(m.diskModes[m.diskModeIdx]))
	row7 := fmt.Sprintf("Filesystem %s, swap %s", greenText.Render(m.fsTypes[m.fsIdx]), greenText.Render(swapVal))
	row8 := "Network: " + greenText.Render("dhcp")

	var warnBox string
	noOpt := "  [ No, cancel and go back ]"
	yesOptText := "  [ YES, erase disk and install ]"
	if m.diskModeIdx == 1 || m.diskModeIdx == 2 {
		yesOptText = "  [ YES, replace partition and install ]"
	}

	if m.diskModeIdx == 0 {
		warnBox = redBgWhiteText.Render(fmt.Sprintf(" ⚠️  WARNING: ALL DATA ON %s (%s) WILL BE PERMANENTLY ERASED! ", device.Path, device.Size))
	} else {
		targetPart := "n/a"
		if len(m.candidateParts) > 0 && m.partIdx >= 0 && m.partIdx < len(m.candidateParts) {
			targetPart = m.candidateParts[m.partIdx].Path
		}
		warnBox = redBgWhiteText.Render(fmt.Sprintf(" ⚠️  WARNING: PARTITION %s WILL BE FORMATTED! OTHER PARTITIONS PRESERVED. ", targetPart))
	}

	if m.diskModeIdx == 2 {
		yesOptText = "  [ YES, format selected root and install Coexist ]"
		warnBox = m.coexistResources()
	}

	yesOpt := dimText.Render(yesOptText)
	if m.confirmChoice == 0 {
		noOpt = cyanText.Render("→ [ No, cancel and go back ]")
	} else {
		noOpt = dimText.Render("  [ No, cancel and go back ]")
		yesOpt = redBgWhiteText.Render("→" + yesOptText[2:])
	}

	optsRow := fmt.Sprintf("%s    %s", noOpt, yesOpt)

	mainContent := lipgloss.JoinVertical(lipgloss.Left, row1, row2, row3, row4, row5, row6, rowMode, row7, row8, "", warnBox, "", optsRow)
	return lipgloss.JoinVertical(lipgloss.Left, stepsView, "", mainContent)
}

// maskPassword nasconde la password nel riepilogo, segnalando se è vuota.
func maskPassword(pass string) string {
	if pass == "" {
		return "(empty!)"
	}
	return strings.Repeat("*", len(pass))
}

func (m model) viewInstall() string {
	stepsView := renderSteps(7)
	header := fmt.Sprintf("Installing: %s\n", cyanText.Render(m.productName))

	spin := m.spinner.View()
	stepMsg := cyanText.Render(m.installMsg)
	if m.installDone {
		if m.installErr != nil {
			if isBasicTTY() {
				spin = "X"
			} else {
				spin = "✗"
			}
			stepMsg = redBgWhiteText.Render(m.installMsg)
		} else {
			if isBasicTTY() {
				spin = "*"
			} else {
				spin = "✓"
			}
		}
	}

	stepInfo := fmt.Sprintf("Step: %s %s\n", stepMsg, spin)
	progBar := m.progress.ViewAs(m.percent)
	hint := ""
	if m.installDone && m.installErr != nil {
		hint = "\n\nSee /var/log/krill.log for details."
	}

	restartLine := ""
	if m.installDone && m.installErr == nil && m.restartEnabled {
		checkbox := "[ ]"
		if m.restartChecked {
			checkbox = "[x]"
		}
		restartLine = fmt.Sprintf("\n\n%s restart now", cyanText.Render(checkbox))
	}

	mainContent := lipgloss.JoinVertical(lipgloss.Left, header, stepInfo, progBar, hint, restartLine)
	return lipgloss.JoinVertical(lipgloss.Left, stepsView, "", mainContent)
}

// --- AVVIO DELL'INSTALLAZIONE REALE ---

// startInstall costruisce il piano dalle scelte dell'interfaccia e lancia
// l'engine in una goroutine; gli eventi arrivano alla TUI dal canale.
func (m *model) startInstall() tea.Cmd {
	m.installCh = make(chan tea.Msg, 8)
	ch := m.installCh
	plan := m.buildPlan()
	go func() {
		err := engine.Run(plan, func(ev engine.Event) {
			ch <- installEventMsg(ev)
		})
		ch <- installDoneMsg{err: err}
		close(ch)
	}()
	return waitInstall(ch)
}

// waitInstall attende il prossimo evento dell'engine.
func waitInstall(ch chan tea.Msg) tea.Cmd {
	return func() tea.Msg {
		return <-ch
	}
}

// runRestart esegue il comando di riavvio (es. "reboot") configurato in
// finished.conf e poi chiude la TUI, stessa scelta della pagina finale
// di Calamares quando "restart now" è selezionato.
func runRestart(command string) tea.Cmd {
	return func() tea.Msg {
		if fields := strings.Fields(command); len(fields) > 0 {
			_ = exec.Command(fields[0], fields[1:]...).Run()
		}
		return tea.Quit()
	}
}

// buildPlan traduce il modello della TUI nel piano per l'engine.
func (m *model) buildPlan() *engine.Plan {
	cfg := m.cfg

	instances := make(map[string]string)
	for _, inst := range cfg.Settings.Instances {
		instances[inst.Id] = inst.Config
	}

	exec := cfg.Settings.Exec()

	mode := "erase"
	targetPart := ""
	espPart := ""
	tableType := orDefault(cfg.Partition.DefaultPartitionTableType, "msdos")

	if m.diskModeIdx == 1 || m.diskModeIdx == 2 {
		mode = "replace"
		if m.diskModeIdx == 2 {
			mode = "coexist"
		}
		if len(m.candidateParts) > 0 && m.partIdx >= 0 && m.partIdx < len(m.candidateParts) {
			targetPart = m.candidateParts[m.partIdx].Path
		}
		if len(m.efiParts) > 0 && m.efiIdx >= 0 && m.efiIdx < len(m.efiParts) {
			espPart = m.efiParts[m.efiIdx].Path
		}
		if len(m.disks) > 0 && m.diskIdx < len(m.disks) {
			tableType = DetectPartitionTableType(m.disks[m.diskIdx].Path)
		}
	}

	swaps := m.availableSwapTypes()
	swapChoice := "none"
	if m.swapIdx < len(swaps) {
		swapChoice = swaps[m.swapIdx]
	}

	homePart, namespace, efiID := "", "", ""
	if mode == "coexist" {
		namespace = m.homeNamespace
		if m.debianEFI {
			efiID = m.efiBootloaderID
		}
		if m.homeIdx >= 0 && m.homeIdx < len(m.homeParts) {
			homePart = m.homeParts[m.homeIdx].Path
		}
	}
	return &engine.Plan{
		ConfigRoot: cfg.Root,
		Exec:       exec,
		Instances:  instances,

		Device:          m.disks[m.diskIdx].Path,
		Mode:            mode,
		HomePartition:   homePart,
		HomeNamespace:   namespace,
		EFIBootloaderID: efiID,
		TargetPartition: targetPart,
		EspPartition:    espPart,
		TableType:       tableType,
		FsType:          m.fsTypes[m.fsIdx],
		Swap:            swapChoice,

		Fullname:  m.userInputs[fieldFullname].Value(),
		Login:     m.userInputs[fieldLogin].Value(),
		UserPass:  m.userInputs[fieldUserPass].Value(),
		RootPass:  m.userInputs[fieldRootPass].Value(),
		Hostname:  m.userInputs[fieldHostname].Value(),
		Autologin: m.userAuto,
		Shell:     cfg.Users.User.Shell,
		Groups:    cfg.Users.DefaultGroups,

		Language:  languages[m.langIdx],
		Region:    m.selectedRegion(),
		Zone:      m.selectedZone(),
		KbdModel:  m.kbdModel,
		KbdLayout: kbdLayouts[m.kbdIdx],

		NetIface:     orDefault(m.network.Iface, "eth0"),
		NetType:      "dhcp",
		NetAddress:   "",
		NetNetmask:   "",
		NetGateway:   "",
		NetDns:       "",
		UnpackSource: cfg.SquashfsSource(),
		RemoveUser:   cfg.Removeuser.Username,
	}
}

// insertAfter inserisce module subito dopo after nella sequenza;
// se after non c'è, la sequenza resta invariata.
func insertAfter(seq []string, after, module string) []string {
	for i, name := range seq {
		if name == after {
			out := append([]string{}, seq[:i+1]...)
			out = append(out, module)
			return append(out, seq[i+1:]...)
		}
	}
	return seq
}

// Run è l'entry point pubblico per invocare l'installer da linea di comando.
// Legge la configurazione generata dalla pipeline e avvia l'interfaccia TUI.
func Run(fstype string) error {
	cfg, err := LoadInstallerConfig(DefaultConfigRoot)
	if err != nil {
		return fmt.Errorf("installer configuration not found in %s: %w", DefaultConfigRoot, err)
	}
	for _, w := range cfg.Warnings {
		fmt.Fprintf(os.Stderr, "[krill] warning: %s\n", w)
	}

	m := initialModel(cfg, fstype)

	// Inizializziamo il programma usando l'AltScreen per non sporcare la history del terminale
	p := tea.NewProgram(m, tea.WithAltScreen())

	if _, err := p.Run(); err != nil {
		return fmt.Errorf("fatal error running krill: %w", err)
	}

	return nil
}

// coexistResources separates formatting from preservation in both disk and summary views.
func (m model) coexistResources() string {
	root, esp, home := "SELECT ROOT", "SELECT ESP", "SELECT SHARED HOME"
	reinstall := false
	if m.homeIdx >= 0 && m.homeIdx < len(m.homeParts) {
		home = m.homeParts[m.homeIdx].Path
	}
	if m.partIdx >= 0 && m.partIdx < len(m.candidateParts) {
		part := m.candidateParts[m.partIdx]
		root = part.Path
		if part.Label != "" {
			root += " [" + part.Label + "]"
		}
		reinstall = m.debianEFI && m.efiBootloaderID != "" && part.Label == m.efiBootloaderID
	}
	if m.efiIdx >= 0 && m.efiIdx < len(m.efiParts) {
		esp = m.efiParts[m.efiIdx].Path
	}
	bootloader := "Bootloader behavior is unchanged."
	if m.debianEFI {
		bootloader = "EFI bootloader: EFI/" + m.efiBootloaderID + " (new directory; preserve EFI/BOOT)"
		if reinstall {
			bootloader = "EFI bootloader: EFI/" + m.efiBootloaderID + " (replace this directory; preserve EFI/BOOT)"
		}
	}
	installKind := ""
	if reinstall {
		installKind = "COEXIST — REINSTALL\n  Installation: " + m.efiBootloaderID
	}
	rows := []string{}
	if reinstall {
		rows = append(rows, redBgWhiteText.Render(installKind))
	}
	rows = append(rows,
		redBgWhiteText.Render("FORMAT:\n  Root: "+root),
		greenText.Render("PRESERVE (no formatting):\n  EFI:  "+esp+"\n  Shared HOME: "+home))
	if reinstall {
		rows = append(rows, cyanText.Render("REPLACE:\n  EFI/"+m.efiBootloaderID))
	}
	rows = append(rows,
		cyanText.Render("HOME:\n  Namespace: "+m.homeNamespace+"\n  Target: /srv/homes/"+m.homeNamespace),
		dimText.Render(bootloader))
	return lipgloss.JoinVertical(lipgloss.Left, rows...)
}
