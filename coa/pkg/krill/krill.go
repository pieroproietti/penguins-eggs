// File: krill/krill.go
package krill

import (
	"fmt"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/progress"
	"github.com/charmbracelet/bubbles/spinner"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// --- DEFINIZIONE DEGLI STATI ---
type appState int

const (
	StateWelcome appState = iota
	StateKeyboard
	StateNetwork
	StateDisk
	StateUsers
	StateSummary
	StateInstall
)

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

	// La larghezza reale viene impostata in View() sulla base del terminale
	// (tea.WindowSizeMsg); 75 è solo il minimo per non spezzare le scritte.
	windowStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			Height(11).
			Padding(0, 1)

	minWindowWidth = 75

	stepBoxStyle = lipgloss.NewStyle().Width(15).Border(lipgloss.NormalBorder(), false, true, false, false).MarginRight(2)
)

type tickMsg time.Time

// --- IL MODELLO GLOBALE ---
type model struct {
	state appState

	// Dimensioni del terminale (aggiornate da tea.WindowSizeMsg)
	termWidth  int
	termHeight int

	// Globale
	appName     string
	productName string
	version     string

	// Welcome
	language string
	arch     string

	// Keyboard
	kbdModel   string
	kbdLayout  string
	kbdVariant string
	kbdOptions string

	// Network (sola lettura: la rete del sistema live)
	network NetworkInfo

	// Disk: selettori navigabili (↑/↓ campo, ←/→ valore)
	diskBios  string
	diskMode  string
	disks     []DiskInfo
	diskIdx   int
	fsTypes   []string
	fsIdx     int
	swapTypes []string
	swapIdx   int
	diskField int

	// Users: campi di testo editabili più il checkbox autologin
	userInputs []textinput.Model
	userFocus  int
	userAuto   bool

	// Summary
	sumRegion string
	sumZone   string

	// Install
	installMsg string
	percent    float64
	spinner    spinner.Model
	progress   progress.Model
}

// initialModel costruisce il modello a partire dalla configurazione
// generata dalla pipeline (la stessa di Calamares) e dal sistema live.
func initialModel(cfg *InstallerConfig) model {
	s := spinner.New()
	s.Spinner = spinner.Dot
	s.Style = lipgloss.NewStyle().Foreground(lipgloss.Color("205"))

	kbd := DetectKeyboard()
	liveUser := DetectLiveUser()
	region, zone := DetectTimezone()

	disks := DetectDisks()
	if len(disks) == 0 {
		disks = []DiskInfo{{Path: "/dev/sda", Size: "?"}}
	}

	fsTypes := cfg.Partition.AvailableFileSystemTypes
	if len(fsTypes) == 0 {
		fsTypes = []string{"ext4"}
	}

	swapTypes := cfg.Partition.UserSwapChoices
	if len(swapTypes) == 0 {
		swapTypes = []string{"none", "small", "suspend", "file"}
	}

	inputs := make([]textinput.Model, 5)
	for i := range inputs {
		inputs[i] = textinput.New()
		inputs[i].Prompt = ""
		inputs[i].CharLimit = 64
		inputs[i].Width = 30
	}
	inputs[fieldFullname].SetValue(liveUser)
	inputs[fieldLogin].SetValue(liveUser)
	inputs[fieldUserPass].EchoMode = textinput.EchoPassword
	inputs[fieldUserPass].Placeholder = "choose a password"
	inputs[fieldRootPass].EchoMode = textinput.EchoPassword
	inputs[fieldRootPass].Placeholder = "empty = same as user"
	inputs[fieldHostname].SetValue(cfg.DefaultHostname())

	return model{
		state:       StateWelcome,
		appName:     "krill",
		productName: orDefault(cfg.Branding.Strings.ProductName, "Linux"),
		version:     orDefault(cfg.Branding.Strings.Version, "n/a"),

		language: DetectLanguage(),
		arch:     runtime.GOARCH,

		kbdModel:   kbd.Model,
		kbdLayout:  kbd.Layout,
		kbdVariant: orDefault(kbd.Variant, "None"),
		kbdOptions: orDefault(kbd.Options, "None"),

		network: DetectNetwork(),

		diskBios:  cfg.FirmwareLabel(),
		diskMode:  "Erase disk",
		disks:     disks,
		diskIdx:   0,
		fsTypes:   fsTypes,
		fsIdx:     indexOf(fsTypes, orDefault(cfg.Partition.DefaultFileSystemType, "ext4")),
		swapTypes: swapTypes,
		swapIdx:   indexOf(swapTypes, orDefault(cfg.Partition.InitialSwapChoice, "none")),

		userInputs: inputs,
		userFocus:  fieldFullname,
		userAuto:   true,

		sumRegion: region,
		sumZone:   zone,

		installMsg: "Copying filesystem...",
		percent:    0.0,
		spinner:    s,
		progress:   progress.New(progress.WithSolidFill("#C59B27")),
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
		// occupato dalla colonna degli step, bordi e padding.
		if barWidth := msg.Width - 28; barWidth > 20 {
			m.progress.Width = barWidth
		}

	case tea.KeyMsg:
		key := msg.String()

		if key == "ctrl+c" {
			return m, tea.Quit
		}
		// 'q' esce ovunque tranne dove si digita del testo
		if key == "q" && m.state != StateUsers {
			return m, tea.Quit
		}

		switch m.state {
		case StateDisk:
			return m.updateDisk(key)
		case StateUsers:
			return m.updateUsers(msg)
		default:
			if key == "enter" {
				switch m.state {
				case StateWelcome:
					m.state = StateKeyboard
				case StateKeyboard:
					m.state = StateNetwork
				case StateNetwork:
					m.state = StateDisk
				case StateSummary:
					m.state = StateInstall
					return m, tick()
				}
			}
		}

	case tickMsg:
		if m.state == StateInstall {
			if m.percent >= 1.0 {
				m.installMsg = "Installation Complete!"
				return m, nil
			}
			m.percent += 0.015
			return m, tick()
		}

	case spinner.TickMsg:
		var cmd tea.Cmd
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd
	}

	return m, nil
}

// updateDisk naviga i selettori della schermata Disk.
func (m model) updateDisk(key string) (tea.Model, tea.Cmd) {
	switch key {
	case "up", "shift+tab":
		m.diskField = cycle(m.diskField, -1, 3)
	case "down", "tab":
		m.diskField = cycle(m.diskField, 1, 3)
	case "left", "right":
		delta := 1
		if key == "left" {
			delta = -1
		}
		switch m.diskField {
		case 0:
			m.diskIdx = cycle(m.diskIdx, delta, len(m.disks))
		case 1:
			m.fsIdx = cycle(m.fsIdx, delta, len(m.fsTypes))
		case 2:
			m.swapIdx = cycle(m.swapIdx, delta, len(m.swapTypes))
		}
	case "enter":
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

// --- VIEW GLOBALE ---
func (m model) View() string {
	title := titleStyle.Render(strings.ToUpper(m.appName) + " INSTALLER - PENGUINS-EGGS")

	var insideBox string
	switch m.state {
	case StateWelcome:
		insideBox = m.viewWelcome()
	case StateKeyboard:
		insideBox = m.viewKeyboard()
	case StateNetwork:
		insideBox = m.viewNetwork()
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

	footer := "\nPress 'q' to quit."
	if m.state == StateUsers {
		footer = "\nPress Ctrl+C to quit."
	}
	if m.state != StateInstall {
		footer += " | Press 'Enter' to continue."
	}

	return "\n" + finalView + "\n" + footer + "\n"
}

// --- HELPER PER LA LISTA DEGLI STEP ---
func renderSteps(currentStep int) string {
	steps := []string{"1. Welcome", "2. Keyboard", "3. Network", "4. Disk", "5. Users", "6. Summary", "7. Install"}
	var renderedSteps []string
	for i, step := range steps {
		if i+1 == currentStep {
			renderedSteps = append(renderedSteps, cyanText.Render("-> "+step))
		} else {
			renderedSteps = append(renderedSteps, "   "+step)
		}
	}
	return stepBoxStyle.Render(strings.Join(renderedSteps, "\n"))
}

// --- COMPONENTI ---
func (m model) viewWelcome() string {
	stepsView := renderSteps(1)
	welcomeText := fmt.Sprintf("Welcome to %s system installer\n\n", m.appName)
	installingText := fmt.Sprintf("We are installing\nLinux %s version %s\non %s\n\n", cyanText.Render(m.productName), cyanText.Render(m.version), cyanText.Render(m.arch))
	langText := fmt.Sprintf("Language: %s", m.language)
	mainContent := lipgloss.JoinVertical(lipgloss.Left, welcomeText, installingText, langText)
	return lipgloss.JoinHorizontal(lipgloss.Top, stepsView, mainContent)
}

func (m model) viewKeyboard() string {
	stepsView := renderSteps(2)
	modelTxt := fmt.Sprintf("Model:   %s", cyanText.Render(m.kbdModel))
	layoutTxt := fmt.Sprintf("Layout:  %s", cyanText.Render(m.kbdLayout))
	variantTxt := fmt.Sprintf("Variant: %s", cyanText.Render(m.kbdVariant))
	optionsTxt := fmt.Sprintf("Options: %s", cyanText.Render(m.kbdOptions))
	mainContent := lipgloss.JoinVertical(lipgloss.Left, modelTxt, layoutTxt, variantTxt, optionsTxt)
	return lipgloss.JoinHorizontal(lipgloss.Top, stepsView, mainContent)
}

func (m model) viewNetwork() string {
	stepsView := renderSteps(3)
	n := m.network
	ifaceTxt := fmt.Sprintf("interface: %s", greenText.Render(orDefault(n.Iface, "none")))
	typeTxt := fmt.Sprintf("type     : %s", greenText.Render(n.Type))
	addrTxt := fmt.Sprintf("address  : %s", greenText.Render(orDefault(n.Address, "n/a")))
	maskTxt := fmt.Sprintf("netmask  : %s", greenText.Render(orDefault(n.Netmask, "n/a")))
	gwTxt := fmt.Sprintf("gateway  : %s", greenText.Render(orDefault(n.Gateway, "n/a")))
	domTxt := fmt.Sprintf("domain   : %s", greenText.Render(n.Domain))
	dnsTxt := fmt.Sprintf("dns      : %s", greenText.Render(orDefault(n.Dns, "n/a")))
	noteTxt := "\nDetected from the live system: the installed system will inherit it."
	mainContent := lipgloss.JoinVertical(lipgloss.Left, ifaceTxt, typeTxt, addrTxt, maskTxt, gwTxt, domTxt, dnsTxt, noteTxt)
	return lipgloss.JoinHorizontal(lipgloss.Top, stepsView, mainContent)
}

func (m model) viewDisk() string {
	stepsView := renderSteps(4)

	device := m.disks[m.diskIdx]
	row1 := fmt.Sprintf("BIOS: %s | Installation mode: %s", cyanText.Render(m.diskBios), cyanText.Render(m.diskMode))
	row2 := m.selectorRow(0, "Installation device", fmt.Sprintf("%s (%s)", device.Path, device.Size))
	row3 := m.selectorRow(1, "Filesystem", m.fsTypes[m.fsIdx])
	row4 := m.selectorRow(2, "User swap choice", m.swapTypes[m.swapIdx])
	help := "\n↑/↓ select field | ←/→ change value"

	warning1 := "(*) this will erase all data currently present on the"
	warning2 := "installation device: " + device.Path
	warningBox := lipgloss.JoinVertical(lipgloss.Left, redBgWhiteText.Render(warning1), redBgWhiteText.Render(warning2))

	mainContent := lipgloss.JoinVertical(lipgloss.Left, row1, "", row2, row3, row4, help, "", warningBox)
	return lipgloss.JoinHorizontal(lipgloss.Top, stepsView, mainContent)
}

// selectorRow disegna un campo a scelta multipla della schermata Disk,
// evidenziando quello su cui si trova il focus.
func (m model) selectorRow(field int, label, value string) string {
	marker := "  "
	if m.diskField == field {
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
	return lipgloss.JoinHorizontal(lipgloss.Top, stepsView, mainContent)
}

func (m model) viewSummary() string {
	stepsView := renderSteps(6)

	login := m.userInputs[fieldLogin].Value()
	hostname := m.userInputs[fieldHostname].Value()
	device := m.disks[m.diskIdx].Path

	row1 := fmt.Sprintf("Installing %s", greenText.Render(m.productName))
	row2 := fmt.Sprintf("User %s pwd %s root pwd %s hostname %s",
		greenText.Render(login),
		greenText.Render(maskPassword(m.userInputs[fieldUserPass].Value())),
		greenText.Render(maskPassword(m.userInputs[fieldRootPass].Value())),
		greenText.Render(hostname))
	row3 := fmt.Sprintf("Set timezone to %s/%s", greenText.Render(m.sumRegion), greenText.Render(m.sumZone))
	row4 := fmt.Sprintf("The system language will be set to %s", greenText.Render(m.language))
	row5 := fmt.Sprintf("Numbers and date locale will be set to %s", greenText.Render(m.language))
	row6 := fmt.Sprintf("Set keyboard model to %s layout %s", greenText.Render(m.kbdModel), greenText.Render(m.kbdLayout))
	row7 := fmt.Sprintf("Filesystem %s, swap %s", greenText.Render(m.fsTypes[m.fsIdx]), greenText.Render(m.swapTypes[m.swapIdx]))

	eraseWarning := "Erase all data on disk"
	msgBox := redBgWhiteText.Render("installation device: " + device)

	mainContent := lipgloss.JoinVertical(lipgloss.Left, row1, row2, row3, row4, row5, row6, row7, "", eraseWarning, msgBox)
	return lipgloss.JoinHorizontal(lipgloss.Top, stepsView, mainContent)
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
	if m.percent >= 1.0 {
		spin = "✓"
	}
	stepInfo := fmt.Sprintf("Step: %s %s\n", cyanText.Render(m.installMsg), spin)
	progBar := m.progress.ViewAs(m.percent)
	mainContent := lipgloss.JoinVertical(lipgloss.Left, header, stepInfo, progBar)
	return lipgloss.JoinHorizontal(lipgloss.Top, stepsView, mainContent)
}

// --- UTILITY ---
func tick() tea.Cmd {
	return tea.Tick(time.Millisecond*100, func(t time.Time) tea.Msg {
		return tickMsg(t)
	})
}

// Run è l'entry point pubblico per invocare l'installer da linea di comando.
// Legge la configurazione generata dalla pipeline e avvia l'interfaccia TUI.
func Run() error {
	cfg, err := LoadInstallerConfig(DefaultConfigRoot)
	if err != nil {
		return fmt.Errorf("configurazione installer non trovata in %s: %w", DefaultConfigRoot, err)
	}
	for _, w := range cfg.Warnings {
		fmt.Fprintf(os.Stderr, "[krill] attenzione: %s\n", w)
	}

	m := initialModel(cfg)

	// Inizializziamo il programma usando l'AltScreen per non sporcare la history del terminale
	p := tea.NewProgram(m, tea.WithAltScreen())

	if _, err := p.Run(); err != nil {
		return fmt.Errorf("errore fatale nell'esecuzione di krill: %w", err)
	}

	return nil
}
