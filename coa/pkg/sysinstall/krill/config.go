// File: krill/config.go
//
// Il reader della configurazione condivisa: Krill legge gli stessi file
// generati dalla pipeline di preparazione (prepareInstallerEnvironment)
// che alimentano Calamares. Il contratto tra i due mondi è la directory
// /etc/penguins-eggs.d/installer.d/ a configurazione finita.
package krill

import (
	"encoding/json"
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"coa/pkg/utils"

	"gopkg.in/yaml.v3"
)

// DefaultConfigRoot è la directory generata dalla pipeline di preparazione.
// Deve coincidere con InstallerDRoot del pacchetto calamares.
const DefaultConfigRoot = "/etc/penguins-eggs.d/installer.d"

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

// RemoveuserConf rispecchia modules/removeuser.conf: l'utente live da rimuovere.
type RemoveuserConf struct {
	Username string `yaml:"username"`
}

// FinishedConf rispecchia modules/finished.conf: cosa proporre a fine
// installazione, stessa semantica della pagina finale di Calamares.
type FinishedConf struct {
	RestartNowEnabled bool   `yaml:"restartNowEnabled"`
	RestartNowChecked bool   `yaml:"restartNowChecked"`
	RestartNowCommand string `yaml:"restartNowCommand"`
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
	Root       string
	Settings   Settings
	Branding   Branding
	Partition  PartitionConf
	Users      UsersConf
	Unpackfs   UnpackfsConf
	Removeuser RemoveuserConf
	Finished   FinishedConf

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
	cfg.loadOptional(filepath.Join(root, "modules", "removeuser.conf"), &cfg.Removeuser)
	cfg.loadOptional(filepath.Join(root, "modules", "finished.conf"), &cfg.Finished)

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

// DefaultHostname legge il valore di /etc/hostname (se presente).
// Se /etc/hostname non esiste o è vuoto, restituisce "naked" come fallback.
func (c *InstallerConfig) DefaultHostname() string {
	if data, err := os.ReadFile("/etc/hostname"); err == nil {
		lines := strings.Split(string(data), "\n")
		for _, line := range lines {
			h := strings.TrimSpace(line)
			if h != "" && !strings.HasPrefix(h, "#") {
				return h
			}
		}
	}
	return "naked"
}

// --- RILEVAMENTO DAL SISTEMA LIVE ---
// Dati che non stanno nella configurazione perché in Calamares
// li raccoglie la GUI: qui servono come default per le schermate.

// DiskInfo descrive un disco fisico candidato all'installazione.
type DiskInfo struct {
	Path string
	Size string
}

// PartitionInfo descrive una partizione presente sul disco.
type PartitionInfo struct {
	Path       string // es. /dev/sda2
	Name       string // es. sda2
	Size       string // es. 50.0G
	SizeBytes  int64  // dimensione in byte
	FsType     string // es. ext4, ntfs, btrfs, vfat
	Label      string // etichetta del filesystem (se presente)
	PartType   string // tipo o GUID della partizione
	MountPoint string // eventuale punto di mount attivo
	IsEfi      bool   // true se è una partizione EFI System
}

func (p PartitionInfo) DisplayString() string {
	var parts []string
	if p.Size != "" {
		parts = append(parts, p.Size)
	}
	if p.FsType != "" {
		parts = append(parts, p.FsType)
	} else {
		parts = append(parts, "free/raw")
	}
	if p.Label != "" {
		parts = append(parts, fmt.Sprintf("%q", p.Label))
	}
	info := strings.Join(parts, " - ")
	return fmt.Sprintf("%s (%s)", p.Path, info)
}

type lsblkRoot struct {
	BlockDevices []lsblkItem `json:"blockdevices"`
}

type lsblkItem struct {
	Path        string          `json:"path"`
	Name        string          `json:"name"`
	Size        json.RawMessage `json:"size"`
	Type        string          `json:"type"`
	FsType      *string         `json:"fstype"`
	Label       *string         `json:"label"`
	PartType    *string         `json:"parttype"`
	MountPoints []string        `json:"mountpoints"`
	Children    []lsblkItem     `json:"children"`
}

func parseLsblkSize(raw json.RawMessage) (int64, string) {
	if len(raw) == 0 {
		return 0, "?"
	}
	var num int64
	if err := json.Unmarshal(raw, &num); err == nil && num > 0 {
		human := fmt.Sprintf("%.1fG", float64(num)/(1024*1024*1024))
		return num, human
	}
	var str string
	if err := json.Unmarshal(raw, &str); err == nil && str != "" {
		return 0, str
	}
	return 0, "?"
}

func isEfiPartition(fsType, label, partType string, mountPoints []string) bool {
	// 1. GUID GPT per EFI System Partition
	if strings.EqualFold(partType, "c12a7328-f81f-11d2-ba4b-00a0c93ec93b") {
		return true
	}
	// 2. ID MBR per EFI System Partition
	if strings.EqualFold(partType, "0xef") || strings.EqualFold(partType, "ef") {
		return true
	}
	// 3. Mountpoint /boot/efi
	for _, mp := range mountPoints {
		if mp == "/boot/efi" {
			return true
		}
	}
	// 4. File system vfat/fat32 con label EFI o ESP
	fsLower := strings.ToLower(fsType)
	labelLower := strings.ToLower(label)
	if (fsLower == "vfat" || fsLower == "fat32" || fsLower == "fat16") &&
		(labelLower == "efi" || labelLower == "esp" || strings.Contains(labelLower, "efi")) {
		return true
	}
	return false
}

func collectPartitions(items []lsblkItem) []PartitionInfo {
	var parts []PartitionInfo
	for _, item := range items {
		if item.Type == "part" {
			sizeBytes, humanSize := parseLsblkSize(item.Size)
			fs := ""
			if item.FsType != nil {
				fs = *item.FsType
			}
			label := ""
			if item.Label != nil {
				label = *item.Label
			}
			pt := ""
			if item.PartType != nil {
				pt = *item.PartType
			}
			mp := ""
			if len(item.MountPoints) > 0 {
				mp = item.MountPoints[0]
			}
			isEfi := isEfiPartition(fs, label, pt, item.MountPoints)

			parts = append(parts, PartitionInfo{
				Path:       item.Path,
				Name:       item.Name,
				Size:       humanSize,
				SizeBytes:  sizeBytes,
				FsType:     fs,
				Label:      label,
				PartType:   pt,
				MountPoint: mp,
				IsEfi:      isEfi,
			})
		}
		if len(item.Children) > 0 {
			parts = append(parts, collectPartitions(item.Children)...)
		}
	}
	return parts
}

// DetectLiveDisk individua il device del supporto live per evitarne la scrittura accidentale.
func DetectLiveDisk() string {
	if mOut, mErr := exec.Command("sh", "-c", "mount | grep /run/live/medium | awk '{print $1}'").Output(); mErr == nil {
		mDev := strings.TrimSpace(string(mOut))
		if mDev != "" {
			if pk, pkErr := exec.Command("lsblk", "-dno", "PKNAME", mDev).Output(); pkErr == nil && len(pk) > 0 {
				pkName := strings.TrimSpace(string(pk))
				if pkName != "" {
					return "/dev/" + pkName
				}
			}
		}
	}
	return ""
}

// DetectPartitions restituisce tutte le partizioni presenti su un disco fisico.
func DetectPartitions(diskPath string) []PartitionInfo {
	out, err := exec.Command("lsblk", "-J", "-b", "-o", "PATH,NAME,SIZE,TYPE,FSTYPE,LABEL,PARTTYPE,MOUNTPOINTS", diskPath).Output()
	if err != nil {
		return nil
	}
	var root lsblkRoot
	if err := json.Unmarshal(out, &root); err != nil {
		return nil
	}
	return collectPartitions(root.BlockDevices)
}

// DetectAllEfiPartitions cerca tutte le partizioni EFI presenti sui dischi di sistema.
func DetectAllEfiPartitions() []PartitionInfo {
	out, err := exec.Command("lsblk", "-J", "-b", "-o", "PATH,NAME,SIZE,TYPE,FSTYPE,LABEL,PARTTYPE,MOUNTPOINTS").Output()
	if err != nil {
		return nil
	}
	var root lsblkRoot
	if err := json.Unmarshal(out, &root); err != nil {
		return nil
	}
	all := collectPartitions(root.BlockDevices)
	return GetEfiPartitions(all)
}

// GetCandidatePartitions filtra le partizioni idonee ad essere sostituite.
func GetCandidatePartitions(parts []PartitionInfo, liveDisk string) []PartitionInfo {
	var candidates []PartitionInfo
	for _, p := range parts {
		if p.IsEfi {
			continue
		}
		if liveDisk != "" && strings.HasPrefix(p.Path, liveDisk) {
			continue
		}
		if p.MountPoint != "" {
			if strings.HasPrefix(p.MountPoint, "/run/live") ||
				p.MountPoint == "/run" ||
				p.MountPoint == "/rofs" ||
				p.MountPoint == "/lib/live/mount" {
				continue
			}
		}
		// Dimensione minima di 4 GiB se la dimensione in byte è nota
		if p.SizeBytes > 0 && p.SizeBytes < 4*1024*1024*1024 {
			continue
		}
		if p.FsType == "swap" {
			continue
		}
		candidates = append(candidates, p)
	}
	return candidates
}

// GetEfiPartitions estrae solo le partizioni EFI tra quelle fornite.
func GetEfiPartitions(parts []PartitionInfo) []PartitionInfo {
	var efis []PartitionInfo
	for _, p := range parts {
		if p.IsEfi {
			efis = append(efis, p)
		}
	}
	return efis
}

// DetectPartitionTableType rileva il tipo di tabella delle partizioni (gpt o msdos).
func DetectPartitionTableType(diskPath string) string {
	out, err := exec.Command("lsblk", "-dno", "PTTYPE", diskPath).Output()
	if err != nil {
		return "gpt"
	}
	pt := strings.TrimSpace(string(out))
	if pt == "dos" {
		return "msdos"
	}
	if pt == "gpt" {
		return "gpt"
	}
	return "gpt"
}

// DetectDisks restituisce i dischi fisici disponibili (esclusi mtdblock, loop, zram).
func DetectDisks() []DiskInfo {
	out, err := exec.Command("lsblk", "-bno", "NAME,SIZE,TYPE").Output()
	if err != nil {
		return nil
	}

	liveDisk := DetectLiveDisk()

	var targetDisks []DiskInfo
	var fallbackDisks []DiskInfo

	for _, line := range strings.Split(string(out), "\n") {
		fields := strings.Fields(line)
		if len(fields) >= 3 && fields[2] == "disk" {
			name := fields[0]
			if strings.HasPrefix(name, "zram") || strings.HasPrefix(name, "loop") || strings.HasPrefix(name, "mtdblock") || strings.HasPrefix(name, "ram") {
				continue
			}
			var sizeBytes int64
			fmt.Sscanf(fields[1], "%d", &sizeBytes)
			// Salta dischi piccolissimi (sotto 1GB)
			if sizeBytes < 1000000000 {
				continue
			}
			humanSize := fmt.Sprintf("%.1fG", float64(sizeBytes)/(1024*1024*1024))
			diskPath := "/dev/" + name

			if liveDisk != "" && diskPath == liveDisk {
				fallbackDisks = append(fallbackDisks, DiskInfo{Path: diskPath, Size: humanSize})
			} else {
				targetDisks = append(targetDisks, DiskInfo{Path: diskPath, Size: humanSize})
			}
		}
	}
	return append(targetDisks, fallbackDisks...)
}

// NetworkInfo descrive la rete corrente del sistema live. La TUI la mostra
// in sola lettura: l'installazione eredita la configurazione del live.
type NetworkInfo struct {
	Iface   string
	Type    string
	Address string
	Netmask string
	Gateway string
	Domain  string
	Dns     string
}

// DetectNetwork legge interfaccia e rotta di default, indirizzo e DNS.
func DetectNetwork() NetworkInfo {
	info := NetworkInfo{Type: "dhcp", Domain: "localdomain"}

	if out, err := exec.Command("ip", "route", "show", "default").Output(); err == nil {
		fields := strings.Fields(string(out))
		for i, f := range fields {
			if f == "via" && i+1 < len(fields) {
				info.Gateway = fields[i+1]
			}
			if f == "dev" && i+1 < len(fields) {
				info.Iface = fields[i+1]
			}
		}
	}

	// Fallback se non c'è una rotta di default (es. installazione offline)
	if info.Iface == "" {
		if ifaces, err := net.Interfaces(); err == nil {
			for _, iface := range ifaces {
				if iface.Flags&net.FlagLoopback != 0 || iface.Flags&net.FlagUp == 0 {
					continue
				}
				name := iface.Name
				if strings.HasPrefix(name, "en") || strings.HasPrefix(name, "eth") || strings.HasPrefix(name, "wl") {
					info.Iface = name
					break
				}
			}
			if info.Iface == "" {
				for _, iface := range ifaces {
					if iface.Flags&net.FlagLoopback == 0 {
						info.Iface = iface.Name
						break
					}
				}
			}
		}
	}

	if info.Iface != "" {
		if out, err := exec.Command("ip", "-4", "-o", "addr", "show", "dev", info.Iface).Output(); err == nil {
			fields := strings.Fields(string(out))
			for i, f := range fields {
				if f == "inet" && i+1 < len(fields) {
					if addr, mask, ok := splitCidr(fields[i+1]); ok {
						info.Address = addr
						info.Netmask = mask
					}
				}
			}
		}
	}

	if data, err := os.ReadFile("/etc/resolv.conf"); err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			fields := strings.Fields(line)
			if len(fields) >= 2 {
				switch fields[0] {
				case "nameserver":
					if info.Dns == "" {
						info.Dns = fields[1]
					}
				case "search", "domain":
					info.Domain = fields[1]
				}
			}
		}
	}
	return info
}

// splitCidr separa "192.168.1.100/24" in indirizzo e netmask puntata.
func splitCidr(cidr string) (addr, mask string, ok bool) {
	ip, ipnet, err := net.ParseCIDR(cidr)
	if err != nil || ip.To4() == nil {
		return "", "", false
	}
	return ip.String(), net.IP(ipnet.Mask).String(), true
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

// TimezoneData contiene regioni e zone lette da /usr/share/zoneinfo.
type TimezoneData struct {
	Regions []string
	Zones   map[string][]string
}

// DetectTimezones legge le regioni e le zone disponibili dal sistema.
func DetectTimezones() TimezoneData {
	validRegions := map[string]bool{
		"Africa": true, "America": true, "Antarctica": true, "Arctic": true,
		"Asia": true, "Atlantic": true, "Australia": true, "Europe": true,
		"Indian": true, "Pacific": true,
	}
	td := TimezoneData{Zones: make(map[string][]string)}
	entries, err := os.ReadDir("/usr/share/zoneinfo")
	if err != nil {
		td.Regions = []string{"Europe"}
		td.Zones["Europe"] = []string{"Rome"}
		return td
	}
	for _, e := range entries {
		if !e.IsDir() || !validRegions[e.Name()] {
			continue
		}
		region := e.Name()
		zones, err := os.ReadDir(filepath.Join("/usr/share/zoneinfo", region))
		if err != nil || len(zones) == 0 {
			continue
		}
		td.Regions = append(td.Regions, region)
		for _, z := range zones {
			if !strings.HasPrefix(z.Name(), ".") {
				td.Zones[region] = append(td.Zones[region], z.Name())
			}
		}
	}
	if len(td.Regions) == 0 {
		td.Regions = []string{"Europe"}
		td.Zones["Europe"] = []string{"Rome"}
	}
	return td
}


// DetectLanguage restituisce la lingua corrente del sistema live.
// Se la connessione di rete non è attiva o LANG non è impostato, restituisce "en_US.UTF-8" come fallback neutro.
func DetectLanguage() string {
	if !utils.HasNetworkConnectivity() {
		return "en_US.UTF-8"
	}
	if lang := os.Getenv("LANG"); lang != "" {
		return lang
	}
	return "en_US.UTF-8"
}
