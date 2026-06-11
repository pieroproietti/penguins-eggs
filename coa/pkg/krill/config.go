// File: krill/config.go
//
// Il reader della configurazione condivisa: Krill legge gli stessi file
// generati dalla pipeline di preparazione (prepareInstallerEnvironment)
// che alimentano Calamares. Il contratto tra i due mondi è la directory
// /etc/oa-tools.d/installer.d/ a configurazione finita.
package krill

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

// DefaultConfigRoot è la directory generata dalla pipeline di preparazione.
// Deve coincidere con oaInstallerRoot del pacchetto calamares.
const DefaultConfigRoot = "/etc/oa-tools.d/installer.d"

// --- STRUTTURE DEI FILE (formato Calamares) ---

// Settings rispecchia settings.conf: la sequenza dei moduli e le istanze.
type Settings struct {
	Sequence  []map[string][]string `yaml:"sequence"`
	Instances []Instance            `yaml:"instances"`
	Branding  string                `yaml:"branding"`
}

// Instance è un'istanza personalizzata (es. shellprocess@oa_bootloader).
type Instance struct {
	Id     string `yaml:"id"`
	Module string `yaml:"module"`
	Config string `yaml:"config"`
}

// Exec restituisce la sequenza appiattita dei moduli di esecuzione.
func (s Settings) Exec() []string {
	var out []string
	for _, step := range s.Sequence {
		out = append(out, step["exec"]...)
	}
	return out
}

// Show restituisce la sequenza appiattita delle pagine da mostrare.
func (s Settings) Show() []string {
	var out []string
	for _, step := range s.Sequence {
		out = append(out, step["show"]...)
	}
	return out
}

// Branding rispecchia branding/<nome>/branding.desc (solo i campi utili alla TUI).
type Branding struct {
	Strings struct {
		ProductName         string `yaml:"productName"`
		ShortProductName    string `yaml:"shortProductName"`
		Version             string `yaml:"version"`
		BootloaderEntryName string `yaml:"bootloaderEntryName"`
		SupportUrl          string `yaml:"supportUrl"`
	} `yaml:"strings"`
}

// PartitionConf rispecchia modules/partition.conf.
type PartitionConf struct {
	DefaultPartitionTableType string   `yaml:"defaultPartitionTableType"`
	DefaultFileSystemType     string   `yaml:"defaultFileSystemType"`
	AvailableFileSystemTypes  []string `yaml:"availableFileSystemTypes"`
	UserSwapChoices           []string `yaml:"userSwapChoices"`
	InitialSwapChoice         string   `yaml:"initialSwapChoice"`
}

// UsersConf rispecchia modules/users.conf.
type UsersConf struct {
	DefaultGroups []string `yaml:"defaultGroups"`
	SudoersGroup  string   `yaml:"sudoersGroup"`
	User          struct {
		Shell string `yaml:"shell"`
	} `yaml:"user"`
	Hostname struct {
		Template string `yaml:"template"`
	} `yaml:"hostname"`
}

// UnpackfsConf rispecchia modules/unpackfs.conf: da dove copiare il filesystem.
type UnpackfsConf struct {
	Unpack []struct {
		Source      string `yaml:"source"`
		SourceFs    string `yaml:"sourcefs"`
		Destination string `yaml:"destination"`
	} `yaml:"unpack"`
}

// --- IL CONTENITORE ---

// InstallerConfig raccoglie tutta la configurazione letta dalla directory.
type InstallerConfig struct {
	Root      string
	Settings  Settings
	Branding  Branding
	Partition PartitionConf
	Users     UsersConf
	Unpackfs  UnpackfsConf

	// Warnings raccoglie i file opzionali mancanti o malformati:
	// non bloccano l'avvio della TUI ma vanno mostrati all'utente.
	Warnings []string
}

// LoadInstallerConfig legge la configurazione generata dalla pipeline.
// settings.conf è obbligatorio (senza sequenza non c'è installazione),
// gli altri file sono tollerati come warning con fallback ai default.
func LoadInstallerConfig(root string) (*InstallerConfig, error) {
	cfg := &InstallerConfig{Root: root}

	if err := loadYaml(filepath.Join(root, "settings.conf"), &cfg.Settings); err != nil {
		return nil, fmt.Errorf("settings.conf non leggibile: %w", err)
	}

	brandingName := cfg.Settings.Branding
	if brandingName == "" {
		brandingName = "eggs"
	}
	cfg.loadOptional(filepath.Join(root, "branding", brandingName, "branding.desc"), &cfg.Branding)
	cfg.loadOptional(filepath.Join(root, "modules", "partition.conf"), &cfg.Partition)
	cfg.loadOptional(filepath.Join(root, "modules", "users.conf"), &cfg.Users)
	cfg.loadOptional(filepath.Join(root, "modules", "unpackfs.conf"), &cfg.Unpackfs)

	return cfg, nil
}

func (c *InstallerConfig) loadOptional(path string, out interface{}) {
	if err := loadYaml(path, out); err != nil {
		c.Warnings = append(c.Warnings, fmt.Sprintf("%s: %v", filepath.Base(path), err))
	}
}

func loadYaml(path string, out interface{}) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return yaml.Unmarshal(data, out)
}

// --- HELPER PER LA TUI ---

// FirmwareLabel traduce il tipo di tabella partizioni nell'etichetta firmware.
func (c *InstallerConfig) FirmwareLabel() string {
	if c.Partition.DefaultPartitionTableType == "gpt" {
		return "UEFI"
	}
	return "BIOS"
}

// SquashfsSource restituisce il filesystem sorgente dell'installazione.
func (c *InstallerConfig) SquashfsSource() string {
	if len(c.Unpackfs.Unpack) > 0 {
		return c.Unpackfs.Unpack[0].Source
	}
	return ""
}

// DefaultHostname espande il template Calamares (es. "oa-${product}")
// usando lo shortProductName del branding, ridotto a un nome valido.
func (c *InstallerConfig) DefaultHostname() string {
	template := c.Users.Hostname.Template
	if template == "" {
		template = "oa-${product}"
	}
	product := "linux"
	if fields := strings.Fields(c.Branding.Strings.ShortProductName); len(fields) > 0 {
		product = sanitizeHostname(fields[0])
	}
	return strings.ReplaceAll(template, "${product}", product)
}

func sanitizeHostname(s string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(s) {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			b.WriteRune(r)
		}
	}
	if b.Len() == 0 {
		return "linux"
	}
	return b.String()
}

// --- RILEVAMENTO DAL SISTEMA LIVE ---
// Dati che non stanno nella configurazione perché in Calamares
// li raccoglie la GUI: qui servono come default per le schermate.

// DetectInstallDevice restituisce il primo disco fisico disponibile.
func DetectInstallDevice() string {
	out, err := exec.Command("lsblk", "-dno", "NAME,TYPE").Output()
	if err != nil {
		return ""
	}
	for _, line := range strings.Split(string(out), "\n") {
		fields := strings.Fields(line)
		if len(fields) == 2 && fields[1] == "disk" && !strings.HasPrefix(fields[0], "zram") {
			return "/dev/" + fields[0]
		}
	}
	return ""
}

// KeyboardInfo descrive la tastiera corrente del sistema live.
type KeyboardInfo struct {
	Model   string
	Layout  string
	Variant string
	Options string
}

// DetectKeyboard legge /etc/default/keyboard (dove esiste, stile Debian).
func DetectKeyboard() KeyboardInfo {
	kbd := KeyboardInfo{Model: "pc105", Layout: "us"}
	data, err := os.ReadFile("/etc/default/keyboard")
	if err != nil {
		return kbd
	}
	for _, line := range strings.Split(string(data), "\n") {
		parts := strings.SplitN(strings.TrimSpace(line), "=", 2)
		if len(parts) != 2 {
			continue
		}
		value := strings.Trim(parts[1], `"`)
		if value == "" {
			continue
		}
		switch parts[0] {
		case "XKBMODEL":
			kbd.Model = value
		case "XKBLAYOUT":
			kbd.Layout = value
		case "XKBVARIANT":
			kbd.Variant = value
		case "XKBOPTIONS":
			kbd.Options = value
		}
	}
	return kbd
}

// DetectLiveUser restituisce l'utente live che ha lanciato il comando,
// con la stessa logica di fallback usata da calamares.PrepareUserConf.
func DetectLiveUser() string {
	liveUser := os.Getenv("SUDO_USER")
	if liveUser == "" || liveUser == "root" {
		return "live"
	}
	return liveUser
}

// DetectTimezone restituisce regione e zona del sistema live.
func DetectTimezone() (string, string) {
	if target, err := os.Readlink("/etc/localtime"); err == nil {
		if idx := strings.Index(target, "zoneinfo/"); idx != -1 {
			tz := target[idx+len("zoneinfo/"):]
			if parts := strings.SplitN(tz, "/", 2); len(parts) == 2 {
				return parts[0], parts[1]
			}
		}
	}
	if data, err := os.ReadFile("/etc/timezone"); err == nil {
		tz := strings.TrimSpace(string(data))
		if parts := strings.SplitN(tz, "/", 2); len(parts) == 2 {
			return parts[0], parts[1]
		}
	}
	return "Europe", "Rome"
}

// DetectLanguage restituisce la lingua corrente del sistema live.
func DetectLanguage() string {
	if lang := os.Getenv("LANG"); lang != "" {
		return lang
	}
	return "en_US.UTF-8"
}
