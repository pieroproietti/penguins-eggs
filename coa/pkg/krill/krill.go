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

	// Network
	netIface       string
	netAddressType string
	netAddress     string
	netNetmask     string
	netGateway     string
	netDomain      string
	netDns         string

	// Disk
	diskBios       string
	diskDevice     string
	diskMode       string
	diskFsType     string
	diskSwapChoice string
	diskMessage    string

	// Users
	userFullname string
	userLogin    string
	userPass     string
	rootPass     string
	userHostname string
	userAuto     bool

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

	device := DetectInstallDevice()
	if device == "" {
		device = "/dev/sda"
	}

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

		netIface:       "eth0",
		netAddressType: "dhcp",
		netAddress:     "192.168.1.100",
		netNetmask:     "255.255.255.0",
		netGateway:     "192.168.1.1",
		netDomain:      "localdomain",
		netDns:         "8.8.8.8",

		diskBios:       cfg.FirmwareLabel(),
		diskDevice:     device,
		diskMode:       "Erase disk",
		diskFsType:     orDefault(cfg.Partition.DefaultFileSystemType, "ext4"),
		diskSwapChoice: orDefault(cfg.Partition.InitialSwapChoice, "none"),
		diskMessage:    "installation device: " + device,

		userFullname: liveUser,
		userLogin:    liveUser,
		userPass:     "******",
		rootPass:     "******",
		userHostname: cfg.DefaultHostname(),
		userAuto:     true,

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
	return m.spinner.Tick
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
		if msg.String() == "q" || msg.String() == "ctrl+c" {
			return m, tea.Quit
		}

		if msg.String() == "enter" {
			switch m.state {
			case StateWelcome:
				m.state = StateKeyboard
			case StateKeyboard:
				m.state = StateNetwork
			case StateNetwork:
				m.state = StateDisk
			case StateDisk:
				m.state = StateUsers
			case StateUsers:
				m.state = StateSummary
			case StateSummary:
				m.state = StateInstall
				return m, tick()
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
	ifaceTxt := fmt.Sprintf("interface: %s", greenText.Render(m.netIface))
	typeTxt := fmt.Sprintf("type     : %s", greenText.Render(m.netAddressType))
	addrTxt := fmt.Sprintf("address  : %s", greenText.Render(m.netAddress))
	maskTxt := fmt.Sprintf("netmask  : %s", greenText.Render(m.netNetmask))
	gwTxt := fmt.Sprintf("gateway  : %s", greenText.Render(m.netGateway))
	domTxt := fmt.Sprintf("domain   : %s", greenText.Render(m.netDomain))
	dnsTxt := fmt.Sprintf("dns      : %s", greenText.Render(m.netDns))
	mainContent := lipgloss.JoinVertical(lipgloss.Left, ifaceTxt, typeTxt, addrTxt, maskTxt, gwTxt, domTxt, dnsTxt)
	return lipgloss.JoinHorizontal(lipgloss.Top, stepsView, mainContent)
}

func (m model) viewDisk() string {
	stepsView := renderSteps(4)

	row1 := fmt.Sprintf("BIOS: %s Installation device: %s", cyanText.Render(m.diskBios), cyanText.Render(m.diskDevice))
	row2 := fmt.Sprintf("Installation mode: %s", cyanText.Render(m.diskMode))
	row3 := fmt.Sprintf("Filesystem: %s", cyanText.Render(m.diskFsType))
	row4 := fmt.Sprintf("User swap choice: %s", cyanText.Render(m.diskSwapChoice))

	warning1 := "(*) this will erase all data currently present on the"
	warning2 := m.diskMessage
	warningBox := lipgloss.JoinVertical(lipgloss.Left, redBgWhiteText.Render(warning1), redBgWhiteText.Render(warning2))

	mainContent := lipgloss.JoinVertical(lipgloss.Left, row1, row2, row3, row4, "", warningBox)
	return lipgloss.JoinHorizontal(lipgloss.Top, stepsView, mainContent)
}

func (m model) viewUsers() string {
	stepsView := renderSteps(5)

	fullTxt := fmt.Sprintf("fullname     : %s", cyanText.Render(m.userFullname))
	loginTxt := fmt.Sprintf("login        : %s", cyanText.Render(m.userLogin))
	passTxt := fmt.Sprintf("user password: %s", cyanText.Render(m.userPass))
	rootTxt := fmt.Sprintf("root password: %s", cyanText.Render(m.rootPass))
	hostTxt := fmt.Sprintf("hostname     : %s", cyanText.Render(m.userHostname))

	autoTxt := ""
	if m.userAuto {
		autoTxt = cyanText.Render("[ ]") // Come da tua logica originale
	} else {
		autoTxt = cyanText.Render("[x] ")
	}

	mainContent := lipgloss.JoinVertical(lipgloss.Left, fullTxt, loginTxt, passTxt, "", rootTxt, hostTxt, autoTxt)
	return lipgloss.JoinHorizontal(lipgloss.Top, stepsView, mainContent)
}

func (m model) viewSummary() string {
	stepsView := renderSteps(6)

	row1 := fmt.Sprintf("Installing %s", greenText.Render(m.productName))
	row2 := fmt.Sprintf("%s/%s pwd root %s hostname %s", greenText.Render(m.userLogin), greenText.Render(m.userPass), greenText.Render(m.rootPass), greenText.Render(m.userHostname))
	row3 := fmt.Sprintf("Set timezone to %s/%s", greenText.Render(m.sumRegion), greenText.Render(m.sumZone))
	row4 := fmt.Sprintf("The system language will be set to %s", greenText.Render(m.language))
	row5 := fmt.Sprintf("Numbers and date locale will be set to %s", greenText.Render(m.language))
	row6 := fmt.Sprintf("Set keyboard model to %s layout %s", greenText.Render(m.kbdModel), greenText.Render(m.kbdLayout))

	eraseWarning := "Erase all data on disk"
	msgBox := redBgWhiteText.Render(m.diskMessage)

	mainContent := lipgloss.JoinVertical(lipgloss.Left, row1, row2, row3, row4, row5, row6, "", eraseWarning, msgBox)
	return lipgloss.JoinHorizontal(lipgloss.Top, stepsView, mainContent)
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
