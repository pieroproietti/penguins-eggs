// File: krill/krill.go
package krill

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"unicode/utf8"

	"coa/pkg/distro"
	"coa/pkg/sysinstall/krill/engine"
	"coa/pkg/utils"

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
	systemID       string
	systemIDCustom bool
	diskError      string
	storageError   string
	diskBios       string
	diskModes      []string
	diskModeIdx    int
	disks          []DiskInfo
	diskIdx        int
	candidateParts []PartitionInfo
	partIdx        int
	efiParts       []PartitionInfo
	efiIdx         int
	fsTypes        []string
	fsIdx          int
	swapTypes      []string
	swapIdx        int
	diskField      int
	initialization *coexistInitialization

	// Coexist: separate preparation and installation paths.
	coexistStage       coexistStage
	coexistReadyChoice int // 0 = install now, 1 = exit

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

func shellQuote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", "'\"'\"'") + "'"
}

func findHostRootDisk() string {
	out, err := utils.ExecCapture("findmnt -n -o SOURCE /")
	if err != nil {
		return ""
	}
	dev := strings.TrimSpace(out)
	if dev == "" {
		return ""
	}
	pk, err := utils.ExecCapture("lsblk -dno PKNAME " + shellQuote(dev))
	if err == nil && strings.TrimSpace(pk) != "" {
		return "/dev/" + strings.TrimSpace(pk)
	}
	return ""
}

// initialModel costruisce il modello a partire dalla configurazione
// generata dalla pipeline (la stessa di Calamares) e dal sistema live.
func initialModel(cfg *InstallerConfig, fstype string) model {
	return initialModelWithOptions(cfg, fstype, false, "")
}

func initialModelWithOptions(cfg *InstallerConfig, fstype string, coexist bool, targetSlot string) model {
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

	coexistDisks := engine.DetectCoexistDisks()
	hasCoexist := len(coexistDisks) > 0

	diskModes := []string{"Erase disk", "Replace a partition"}
	if hasCoexist || coexist {
		diskModes = append(diskModes, "Coexist")
	}
	diskModeIdx := 0
	diskIdx := 0

	if coexist || (!utils.IsLive() && hasCoexist) {
		for i, dm := range diskModes {
			if strings.HasPrefix(dm, "Coexist") {
				diskModeIdx = i
				break
			}
		}
		if hasCoexist {
			targetDisk := coexistDisks[0].Device
			if targetSlot != "" {
				for _, cd := range coexistDisks {
					for _, s := range cd.Slots {
						if s.Device == targetSlot {
							targetDisk = cd.Device
							break
						}
					}
				}
			} else {
				hostDisk := findHostRootDisk()
				if hostDisk != "" && len(coexistDisks) > 0 {
					for _, cd := range coexistDisks {
						if cd.Device != hostDisk {
							targetDisk = cd.Device
							break
						}
					}
				}
			}
			for i, d := range disks {
				if d.Path == targetDisk {
					diskIdx = i
					break
				}
			}
		}
	}

	var candidateParts []PartitionInfo
	var efiParts []PartitionInfo
	if len(disks) > 0 {
		allParts := DetectPartitions(disks[diskIdx].Path)
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
	const DefaultPassword = "evolution"

	// "artisan"/"evolution" è l'utente proposto di default: quello del
	// sistema live (es. "live") non ha senso come account permanente.
	inputs[fieldFullname].SetValue("artisan")
	inputs[fieldLogin].SetValue("artisan")
	inputs[fieldUserPass].EchoMode = textinput.EchoPassword
	inputs[fieldUserPass].SetValue(DefaultPassword)
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

	m := model{
		state:       StateWelcome,
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
		diskIdx:        diskIdx,
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
	m.refreshPartitions()
	if m.isCoexist() {
		m.coexistStage = coexistInstall
		if len(m.candidateParts) > 0 {
			m.partIdx = 0
			if targetSlot != "" {
				for i, p := range m.candidateParts {
					if p.Path == targetSlot {
						m.partIdx = i
						break
					}
				}
			}
		}
		if len(m.efiParts) > 0 {
			m.efiIdx = 0
		}
		if len(m.candidateParts) > 0 && m.partIdx >= 0 {
			m.systemID = engine.GenerateSlotSystemID(m.candidateParts[m.partIdx].Path, distro.NewDistro().DistroID)
			m.userInputs[fieldHostname].SetValue(m.systemID)
		}
	}
	return m
}

func (m model) isCoexist() bool {
	if m.diskModeIdx == 2 && len(m.diskModes) == 0 {
		return true
	}
	if m.diskModeIdx >= 0 && m.diskModeIdx < len(m.diskModes) {
		return strings.HasPrefix(m.diskModes[m.diskModeIdx], "Coexist")
	}
	return false
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
			if m.diskField >= 0 && m.diskField < len(fields) && fields[m.diskField] == diskFieldNamespace && msg.Type == tea.KeyRunes {
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
	m.refreshPartitionsWith(DetectPartitionInventory, DetectLiveDisk())
}

func (m *model) refreshPartitionsWith(detect func() ([]PartitionInfo, error), liveDisk string) {
	m.candidateParts, m.efiParts = nil, nil
	m.partIdx, m.efiIdx = -1, -1
	m.storageError = ""
	allParts, err := detect()
	if err != nil {
		m.storageError = err.Error()
		return
	}
	if len(m.disks) == 0 || m.diskIdx < 0 || m.diskIdx >= len(m.disks) {
		m.storageError = "No installation disk available."
		return
	}
	device := m.disks[m.diskIdx].Path
	var parts []PartitionInfo
	for _, part := range allParts {
		if part.Disk == device {
			parts = append(parts, part)
		}
	}
	m.candidateParts = GetCandidatePartitions(parts, liveDisk)
	m.efiParts = GetEfiPartitions(parts)
	if m.diskModeIdx == 2 {
		m.efiParts = coexistEfiPartitions(m.efiParts)
		if len(m.efiParts) == 1 {
			m.efiIdx = 0
		}
	} else {
		m.partIdx, m.efiIdx = 0, 0
		if len(m.efiParts) == 0 && m.diskBios == "UEFI" {
			m.efiParts = GetEfiPartitions(allParts)
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
	diskFieldNamespace
	diskFieldFs
	diskFieldSwap
	diskFieldInitialize
	diskFieldPrepare
	diskFieldInstall
)

func (m *model) activeDiskFields() []diskFieldKind {
	if m.isCoexist() {
		switch m.coexistStage {
		case coexistChoose:
			return []diskFieldKind{diskFieldMode, diskFieldInstall, diskFieldPrepare}
		case coexistPrepare:
			return []diskFieldKind{diskFieldDevice, diskFieldInitialize}
		case coexistInstall:
			if len(m.efiParts) == 0 {
				return []diskFieldKind{diskFieldDevice}
			}
			return []diskFieldKind{diskFieldDevice, diskFieldTargetPart, diskFieldFs, diskFieldNamespace, diskFieldSwap}
		case coexistReady:
			return nil
		}
	}
	if m.diskModeIdx == 0 {
		return []diskFieldKind{diskFieldMode, diskFieldDevice, diskFieldFs, diskFieldSwap}
	}
	fields := []diskFieldKind{diskFieldMode, diskFieldDevice, diskFieldTargetPart}
	if m.diskBios == "UEFI" && len(m.efiParts) > 1 {
		fields = append(fields, diskFieldEfi)
	}
	fields = append(fields, diskFieldFs, diskFieldSwap)
	return fields
}

func (m *model) availableSwapTypes() []string {
	if m.diskModeIdx == 1 || m.isCoexist() {
		return []string{"none", "file"}
	}
	return m.swapTypes
}

// updateDisk naviga i selettori della schermata Disk.
func (m model) updateDisk(key string) (tea.Model, tea.Cmd) {
	if m.isCoexist() {
		if m.coexistStage == coexistReady {
			return m.updateCoexistReady(key)
		}
		if key == "esc" && m.coexistStage != coexistChoose {
			m.diskField = 2
			if m.coexistStage == coexistInstall {
				m.diskField = 1
			}
			m.coexistStage, m.diskError = coexistChoose, ""
			return m, nil
		}
	}
	if key == "esc" {
		m.state = StateWelcome
		return m, nil
	}
	activeFields := m.activeDiskFields()
	if m.diskField >= len(activeFields) {
		m.diskField = len(activeFields) - 1
	}
	if activeFields[m.diskField] == diskFieldInitialize && key == "enter" {
		return m.startCoexistPreview(m.previewCoexistInitialization)
	}
	if m.isCoexist() && key == "enter" {
		switch m.coexistStage {
		case coexistChoose:
			switch activeFields[m.diskField] {
			case diskFieldPrepare:
				m.refreshPartitions()
				m.coexistStage, m.diskField = coexistPrepare, 0
			case diskFieldInstall:
				m.refreshPartitions()
				m.coexistStage, m.diskField = coexistInstall, 0
			default:
				m.diskField = 1
			}
			m.diskError = ""
			return m, nil
		}
	}

	if activeFields[m.diskField] == diskFieldNamespace {
		edited := false
		switch key {
		case "backspace", "ctrl+h":
			m.systemIDCustom = true
			if len(m.systemID) > 0 {
				_, size := utf8.DecodeLastRuneInString(m.systemID)
				m.systemID = m.systemID[:len(m.systemID)-size]
			}
			edited = true
		case "up", "down", "tab", "shift+tab", "enter", "left", "right":
		default:
			// Retain invalid input, including pasted Unicode and overlong IDs,
			// so validation rejects it visibly instead of silently sanitizing it.
			if utf8.RuneCountInString(key) == 1 {
				if !m.systemIDCustom {
					m.systemID = key
					m.systemIDCustom = true
				} else {
					m.systemID += key
				}
				edited = true
			}
		}
		if edited {
			m.diskError = ""
			if err := engine.ValidateEFIBootloaderID(m.systemID); err != nil {
				m.diskError = err.Error()
			} else if len(m.userInputs) > fieldHostname {
				m.userInputs[fieldHostname].SetValue(m.systemID)
			}
			return m, nil
		}
	}

	switch key {
	case "up", "shift+tab":
		m.diskField = cycle(m.diskField, -1, len(activeFields))
	case "down", "tab":
		m.diskField = cycle(m.diskField, 1, len(activeFields))
	case "left":
		delta := -1
		if len(activeFields) == 0 {
			return m, nil
		}
		currentKind := activeFields[m.diskField]
		switch currentKind {
		case diskFieldMode:
			m.diskModeIdx = cycle(m.diskModeIdx, delta, len(m.diskModes))
			m.coexistStage, m.diskError = coexistInstall, ""
			m.refreshPartitions()
			if m.diskField >= len(m.activeDiskFields()) {
				m.diskField = 0
			}
			if m.isCoexist() && len(m.candidateParts) > 0 {
				m.partIdx = 0
				m.systemID = engine.GenerateSlotSystemID(m.candidateParts[0].Path, distro.NewDistro().DistroID)
				if len(m.userInputs) > fieldHostname {
					m.userInputs[fieldHostname].SetValue(m.systemID)
				}
			}
		case diskFieldDevice:
			m.diskIdx = cycle(m.diskIdx, delta, len(m.disks))
			m.refreshPartitions()
			m.diskError = ""
			if m.isCoexist() && len(m.candidateParts) > 0 {
				m.partIdx = 0
				m.systemID = engine.GenerateSlotSystemID(m.candidateParts[0].Path, distro.NewDistro().DistroID)
				if len(m.userInputs) > fieldHostname {
					m.userInputs[fieldHostname].SetValue(m.systemID)
				}
			}
		case diskFieldTargetPart:
			if len(m.candidateParts) > 0 {
				m.partIdx = cycle(m.partIdx, delta, len(m.candidateParts))
				if m.isCoexist() && m.partIdx >= 0 && m.partIdx < len(m.candidateParts) && !m.systemIDCustom {
					m.systemID = engine.GenerateSlotSystemID(m.candidateParts[m.partIdx].Path, distro.NewDistro().DistroID)
					if len(m.userInputs) > fieldHostname {
						m.userInputs[fieldHostname].SetValue(m.systemID)
					}
				}
			}
		case diskFieldEfi:
			if len(m.efiParts) > 0 {
				m.efiIdx = cycle(m.efiIdx, delta, len(m.efiParts))
			}
		case diskFieldFs:
			m.fsIdx = cycle(m.fsIdx, delta, len(m.fsTypes))
		case diskFieldSwap:
			swaps := m.availableSwapTypes()
			m.swapIdx = cycle(m.swapIdx, delta, len(swaps))
		}
	case "right":
		delta := 1
		if len(activeFields) == 0 {
			return m, nil
		}
		currentKind := activeFields[m.diskField]
		switch currentKind {
		case diskFieldMode:
			m.diskModeIdx = cycle(m.diskModeIdx, delta, len(m.diskModes))
			m.coexistStage, m.diskError = coexistInstall, ""
			m.refreshPartitions()
			if m.diskField >= len(m.activeDiskFields()) {
				m.diskField = 0
			}
			if m.isCoexist() && len(m.candidateParts) > 0 {
				m.partIdx = 0
				m.systemID = engine.GenerateSlotSystemID(m.candidateParts[0].Path, distro.NewDistro().DistroID)
				if len(m.userInputs) > fieldHostname {
					m.userInputs[fieldHostname].SetValue(m.systemID)
				}
			}
		case diskFieldDevice:
			m.diskIdx = cycle(m.diskIdx, delta, len(m.disks))
			m.refreshPartitions()
			m.diskError = ""
			if m.isCoexist() && len(m.candidateParts) > 0 {
				m.partIdx = 0
				m.systemID = engine.GenerateSlotSystemID(m.candidateParts[0].Path, distro.NewDistro().DistroID)
				if len(m.userInputs) > fieldHostname {
					m.userInputs[fieldHostname].SetValue(m.systemID)
				}
			}
		case diskFieldTargetPart:
			if len(m.candidateParts) > 0 {
				m.partIdx = cycle(m.partIdx, delta, len(m.candidateParts))
				if m.isCoexist() && m.partIdx >= 0 && m.partIdx < len(m.candidateParts) && !m.systemIDCustom {
					m.systemID = engine.GenerateSlotSystemID(m.candidateParts[m.partIdx].Path, distro.NewDistro().DistroID)
					if len(m.userInputs) > fieldHostname {
						m.userInputs[fieldHostname].SetValue(m.systemID)
					}
				}
			}
		case diskFieldEfi:
			if len(m.efiParts) > 0 {
				m.efiIdx = cycle(m.efiIdx, delta, len(m.efiParts))
			}
		case diskFieldFs:
			m.fsIdx = cycle(m.fsIdx, delta, len(m.fsTypes))
		case diskFieldSwap:
			swaps := m.availableSwapTypes()
			m.swapIdx = cycle(m.swapIdx, delta, len(swaps))
		}
	case "enter":
		m.diskError = ""
		if m.storageError != "" {
			m.diskError = m.storageError
			return m, nil
		}
		if m.isCoexist() {
			if !engine.IsUEFI() {
				m.diskError = "Coexist requires the live system to be booted in UEFI mode."
			} else if err := engine.ValidateCoexistFamily(distro.NewDistro().FamilyID); err != nil {
				m.diskError = err.Error()
			} else if err := m.coexistESPError(); err != "" {
				m.diskError = err
			} else if m.partIdx < 0 || m.partIdx >= len(m.candidateParts) {
				m.diskError = "Select the root partition to FORMAT."
			} else if err := engine.ValidateEFIBootloaderID(m.systemID); err != nil {
				m.diskError = err.Error()
			}
			if m.diskError != "" {
				return m, nil
			}
		}
		if m.diskModeIdx == 1 && len(m.candidateParts) == 0 {
			// Non possiamo proseguire se non c'è una partizione valida da sostituire
			return m, nil
		}
		return m.advanceToUsersOrSummary()
	}
	return m, nil
}

// Follow the generated module sequence, including clone account preservation.
func (m model) createsUsers() bool {
	for _, module := range m.cfg.Settings.Exec() {
		if module == "users" {
			return true
		}
	}
	return false
}

func (m model) advanceToUsersOrSummary() (tea.Model, tea.Cmd) {
	if !m.createsUsers() {
		m.state = StateSummary
		m.confirmChoice = 0
		return m, nil
	}
	m.state = StateUsers
	return m, m.focusUser(fieldFullname)
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
			if m.createsUsers() && (m.userInputs[fieldLogin].Value() == "" || m.userInputs[fieldUserPass].Value() == "") {
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
	} else if m.state == StateDisk && m.isCoexist() {
		footer = "\n↑/↓ select | Enter: continue to Users | Ctrl+C: quit"
		if len(m.efiParts) == 0 {
			footer = "\n←/→ choose another disk | Esc: cancel | Ctrl+C: quit"
		}
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
	if m.isCoexist() {
		switch m.coexistStage {
		case coexistChoose:
			return m.viewCoexistChoice()
		case coexistPrepare:
			return m.viewCoexistPreparation()
		case coexistInstall:
			if len(m.efiParts) == 0 {
				return m.viewCoexistMissingESP()
			}
		case coexistReady:
			return m.viewCoexistReady()
		}
	}
	stepsView := renderSteps(4)

	activeFields := m.activeDiskFields()
	device := m.disks[m.diskIdx]

	firmware := m.diskBios
	if m.isCoexist() {
		firmware = "BIOS"
		if engine.IsUEFI() {
			firmware = "UEFI"
		}
	}
	rowFirmware := fmt.Sprintf("Firmware: %s", cyanText.Render(firmware))

	var rows []string
	if m.isCoexist() {
		rows = append(rows, cyanText.Render("Coexist — Install a distribution")+" | "+rowFirmware)
	} else {
		rows = append(rows, rowFirmware, "")
	}

	for idx, kind := range activeFields {
		isActive := (idx == m.diskField)
		switch kind {
		case diskFieldMode:
			modeStr := "Coexist"
			if m.diskModeIdx >= 0 && m.diskModeIdx < len(m.diskModes) {
				modeStr = m.diskModes[m.diskModeIdx]
			}
			rows = append(rows, m.selectorRow(isActive, "Installation mode", modeStr))
		case diskFieldDevice:
			rows = append(rows, m.selectorRow(isActive, "Installation device", fmt.Sprintf("%s (%s)", device.Path, device.Size)))
		case diskFieldTargetPart:
			partStr := "none available"
			if m.isCoexist() && len(m.candidateParts) > 0 {
				partStr = "SELECT ROOT"
			}
			if len(m.candidateParts) > 0 && m.partIdx >= 0 {
				partStr = m.candidateParts[m.partIdx].DisplayString()
			}
			rows = append(rows, m.selectorRow(isActive, "Target partition", partStr))
			if m.isCoexist() {
				esp := m.coexistESPError()
				if esp == "" {
					esp = m.efiParts[0].Path + " [fixed, preserved]"
				}
				rows = append(rows, m.selectorRow(false, "EFI System Partition", esp))
			} else if m.diskBios == "UEFI" && len(m.efiParts) == 1 {
				rows = append(rows, fmt.Sprintf("  %-20s: %s %s", "EFI System Partition",
					greenText.Render(m.efiParts[0].Path+" ("+m.efiParts[0].Size+")"),
					dimText.Render("[auto-detected, preserved]")))
			} else if !m.isCoexist() && m.diskBios == "UEFI" && len(m.efiParts) == 0 {
				rows = append(rows, fmt.Sprintf("  %-20s: %s", "EFI System Partition",
					redBgWhiteText.Render(" none detected ")))
			}
		case diskFieldEfi:
			efiStr := "none"
			if len(m.efiParts) > 0 && m.efiIdx >= 0 {
				efiStr = m.efiParts[m.efiIdx].Path + " (" + m.efiParts[m.efiIdx].Size + ")"
			}
			rows = append(rows, m.selectorRow(isActive, "EFI System Partition", efiStr))
		case diskFieldNamespace:
			rows = append(rows, m.selectorRow(isActive, "System Name (ID)", orDefault(m.systemID, "type an ID, e.g. debian")))
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

	if m.isCoexist() {
		rows = append(rows, "↑/↓ select | ←/→ change | System Name (ID): type to edit")
		rows = append(rows, redBgWhiteText.Render("FORMAT target ROOT slot; preserve ESP and other slots."))
		if m.diskError != "" {
			rows = append(rows, redBgWhiteText.Render(m.diskError))
		}
		return lipgloss.JoinVertical(lipgloss.Left, stepsView, "", strings.Join(rows, "\n"))
	}

	help := "\n↑/↓ select field | ←/→ change value"
	rows = append(rows, help, "")

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
	if !m.createsUsers() {
		row2 = "Preserve cloned users, passwords, home directories and hostname"
	}
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
	if m.diskModeIdx == 1 || m.isCoexist() {
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

	if m.isCoexist() {
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

	if m.diskModeIdx == 1 || m.isCoexist() {
		mode = "replace"
		if m.isCoexist() {
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

	efiID, previousID := "", ""
	if mode == "coexist" {
		efiID = m.systemID
		if len(m.candidateParts) > 0 && m.partIdx >= 0 && m.partIdx < len(m.candidateParts) {
			oldLabel := m.candidateParts[m.partIdx].Label
			if oldLabel != "" && !engine.IsGenericRootLabel(oldLabel) && engine.ValidateInstallationID(oldLabel) == nil {
				previousID = oldLabel
			}
		}
	}
	return &engine.Plan{
		ConfigRoot: cfg.Root,
		Exec:       exec,
		Instances:  instances,

		Device:          m.disks[m.diskIdx].Path,
		Mode:            mode,
		EFIBootloaderID: efiID,
		PreviousID:      previousID,
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
	_, err := RunWithSlot(fstype, false, "")
	return err
}

func RunWithOptions(fstype string, coexist bool) (bool, error) {
	return RunWithSlot(fstype, coexist, "")
}

func RunWithSlot(fstype string, coexist bool, targetSlot string) (bool, error) {
	cfg, err := LoadInstallerConfig(DefaultConfigRoot)
	if err != nil {
		return false, fmt.Errorf("installer configuration not found in %s: %w", DefaultConfigRoot, err)
	}
	for _, w := range cfg.Warnings {
		fmt.Fprintf(os.Stderr, "[krill] warning: %s\n", w)
	}

	m := initialModelWithOptions(cfg, fstype, coexist, targetSlot)

	// Inizializziamo il programma usando l'AltScreen per non sporcare la history del terminale
	p := tea.NewProgram(m, tea.WithAltScreen())

	finalModel, err := p.Run()
	if err != nil {
		return false, fmt.Errorf("fatal error running krill: %w", err)
	}

	installed := false
	if fm, ok := finalModel.(model); ok && fm.installDone && fm.installErr == nil {
		installed = true
	}

	return installed, nil
}

// coexistResources separates formatting from preservation in both disk and summary views.
func (m model) coexistResources() string {
	root, esp := "SELECT ROOT", "SELECT ESP"
	oldLabel := ""
	if m.partIdx >= 0 && m.partIdx < len(m.candidateParts) {
		part := m.candidateParts[m.partIdx]
		root = part.Path
		if part.Label != "" {
			root += " [" + part.Label + "]"
			if !engine.IsGenericRootLabel(part.Label) && engine.ValidateInstallationID(part.Label) == nil {
				oldLabel = part.Label
			}
		}
	}
	if m.efiIdx >= 0 && m.efiIdx < len(m.efiParts) {
		esp = m.efiParts[m.efiIdx].Path
	}
	preserve := "PRESERVE (no formatting):\n  ESP: " + esp + "\n  All other ROOT slots"
	cleanup := "DELETE CONTENTS if present / CREATE if absent:\n  EFI/" + m.systemID + "\n  Matching UEFI NVRAM entries"
	rows := []string{
		cyanText.Render("COEXIST\n  System Name (ID): " + m.systemID),
		redBgWhiteText.Render("FORMAT:\n  Slot (ROOT): " + root + "\n  New label: " + m.systemID),
		greenText.Render(preserve),
		redBgWhiteText.Render(cleanup),
	}
	if oldLabel != "" && oldLabel != m.systemID {
		previous := "PURGE PREVIOUS (" + oldLabel + "):\n  EFI: EFI/" + oldLabel + "\n  Matching UEFI NVRAM entries"
		rows = append(rows, redBgWhiteText.Render(previous))
	}
	return lipgloss.JoinVertical(lipgloss.Left, rows...)
}
