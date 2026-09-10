package krill

import (
	"os"
	"path/filepath"
	"testing"
)

// buildFixture genera una directory di configurazione come quella prodotta
// dalla pipeline: il settings.conf reale (dagli asset del repo) più i file
// dinamici nel formato scritto dal pacchetto calamares.
func buildFixture(t *testing.T) string {
	t.Helper()
	root := t.TempDir()

	settings, err := os.ReadFile("../../assets/calamares_base/settings.conf")
	if err != nil {
		t.Fatalf("settings.conf non trovato negli asset: %v", err)
	}
	mustWrite(t, filepath.Join(root, "settings.conf"), settings)

	mustWrite(t, filepath.Join(root, "branding", "eggs", "branding.desc"), []byte(`---
componentName: eggs
strings:
  productName:      "DEBIAN GNU/LINUX 13"
  shortProductName: "debian gnu/linux 13"
  version:          "penguins-eggs 0.8.6"
`))

	mustWrite(t, filepath.Join(root, "modules", "partition.conf"), []byte(`---
defaultPartitionTableType: gpt
defaultFileSystemType: "ext4"
availableFileSystemTypes: ["ext4", "btrfs"]
userSwapChoices: [none, small, suspend, file]
initialSwapChoice: none
`))

	mustWrite(t, filepath.Join(root, "modules", "users.conf"), []byte(`---
defaultGroups:
  - audio
  - video
sudoersGroup: sudo
hostname:
  location: EtcFile
  template: "oa-${product}"
`))

	mustWrite(t, filepath.Join(root, "modules", "unpackfs.conf"), []byte(`---
unpack:
  - source: "/run/live/medium/live/filesystem.squashfs"
    sourcefs: "squashfs"
    destination: ""
`))

	mustWrite(t, filepath.Join(root, "modules", "removeuser.conf"), []byte(`---
username: live
`))

	mustWrite(t, filepath.Join(root, "modules", "finished.conf"), []byte(`---
restartNowEnabled: true
restartNowChecked: false
restartNowCommand: "reboot"
`))

	return root
}

func mustWrite(t *testing.T, path string, data []byte) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, data, 0644); err != nil {
		t.Fatal(err)
	}
}

func TestLoadInstallerConfig(t *testing.T) {
	cfg, err := LoadInstallerConfig(buildFixture(t))
	if err != nil {
		t.Fatalf("LoadInstallerConfig: %v", err)
	}
	if len(cfg.Warnings) != 0 {
		t.Errorf("warnings inattesi: %v", cfg.Warnings)
	}

	if got := cfg.Branding.Strings.ProductName; got != "DEBIAN GNU/LINUX 13" {
		t.Errorf("productName = %q", got)
	}
	if got := cfg.FirmwareLabel(); got != "UEFI" {
		t.Errorf("FirmwareLabel = %q, atteso UEFI", got)
	}
	if got := cfg.DefaultHostname(); got == "" {
		t.Errorf("DefaultHostname vuoto")
	}
	if got := cfg.SquashfsSource(); got != "/run/live/medium/live/filesystem.squashfs" {
		t.Errorf("SquashfsSource = %q", got)
	}
	if got := cfg.Users.SudoersGroup; got != "sudo" {
		t.Errorf("sudoersGroup = %q", got)
	}
	if got := cfg.Removeuser.Username; got != "live" {
		t.Errorf("removeuser = %q", got)
	}

	// La sequenza exec del settings.conf reale deve contenere i moduli chiave
	// nell'ordine: partition prima di unpackfs, umount per ultimo.
	exec := cfg.Settings.Exec()
	if len(exec) == 0 {
		t.Fatal("sequenza exec vuota")
	}
	if exec[0] != "partition" {
		t.Errorf("primo modulo exec = %q, atteso partition", exec[0])
	}
	if exec[len(exec)-1] != "umount" {
		t.Errorf("ultimo modulo exec = %q, atteso umount", exec[len(exec)-1])
	}

	show := cfg.Settings.Show()
	if len(show) == 0 || show[0] != "welcome" {
		t.Errorf("sequenza show = %v, attesa apertura con welcome", show)
	}
}

func TestLoadInstallerConfigMissingSettings(t *testing.T) {
	if _, err := LoadInstallerConfig(t.TempDir()); err == nil {
		t.Fatal("atteso errore con settings.conf mancante")
	}
}

func TestLoadInstallerConfigTolleranteSuiModuli(t *testing.T) {
	root := buildFixture(t)
	os.Remove(filepath.Join(root, "modules", "partition.conf"))

	cfg, err := LoadInstallerConfig(root)
	if err != nil {
		t.Fatalf("un modulo mancante non deve essere fatale: %v", err)
	}
	if len(cfg.Warnings) != 1 {
		t.Errorf("atteso 1 warning, trovati: %v", cfg.Warnings)
	}
	if got := cfg.FirmwareLabel(); got != "BIOS" {
		t.Errorf("FirmwareLabel senza partition.conf = %q, atteso fallback BIOS", got)
	}
}

func TestDetectLanguage(t *testing.T) {
	lang := DetectLanguage()
	if lang == "" {
		t.Error("DetectLanguage non dovrebbe mai restituire una stringa vuota")
	}
}

func TestIsEfiPartition(t *testing.T) {
	cases := []struct {
		fs     string
		label  string
		pt     string
		mps    []string
		expect bool
	}{
		{"vfat", "SYSTEM", "c12a7328-f81f-11d2-ba4b-00a0c93ec93b", nil, true},
		{"vfat", "EFI", "0xef", nil, true},
		{"vfat", "", "", []string{"/boot/efi"}, true},
		{"vfat", "EFI", "", nil, true},
		{"ext4", "ROOT", "0x83", []string{"/"}, false},
		{"ntfs", "Basic data", "", nil, false},
	}

	for _, c := range cases {
		if got := isEfiPartition(c.fs, c.label, c.pt, c.mps); got != c.expect {
			t.Errorf("isEfiPartition(%q, %q, %q, %v) = %v, want %v", c.fs, c.label, c.pt, c.mps, got, c.expect)
		}
	}
}

func TestGetCandidatePartitions(t *testing.T) {
	parts := []PartitionInfo{
		{Path: "/dev/sda1", SizeBytes: 512 * 1024 * 1024, IsEfi: true, FsType: "vfat"},
		{Path: "/dev/sda2", SizeBytes: 2 * 1024 * 1024 * 1024, FsType: "ext4"}, // < 4GB -> scartata
		{Path: "/dev/sda3", SizeBytes: 50 * 1024 * 1024 * 1024, FsType: "ext4"},
		{Path: "/dev/sda4", SizeBytes: 8 * 1024 * 1024 * 1024, FsType: "swap"}, // swap -> scartata
		{Path: "/dev/sdb1", SizeBytes: 16 * 1024 * 1024 * 1024, FsType: "iso9660", MountPoint: "/run/live/medium"}, // live -> scartata
	}

	candidates := GetCandidatePartitions(parts, "/dev/sdb")
	if len(candidates) != 1 {
		t.Fatalf("attesa 1 partizione candidata, trovate %d: %+v", len(candidates), candidates)
	}
	if candidates[0].Path != "/dev/sda3" {
		t.Errorf("candidata errata: %s, attesa /dev/sda3", candidates[0].Path)
	}

	efis := GetEfiPartitions(parts)
	if len(efis) != 1 || efis[0].Path != "/dev/sda1" {
		t.Errorf("partizioni EFI errate: %+v", efis)
	}
}

func TestPartitionDisplayString(t *testing.T) {
	p := PartitionInfo{
		Path:   "/dev/sda3",
		Size:   "50.0G",
		FsType: "ext4",
		Label:  "Debian",
	}
	got := p.DisplayString()
	want := `/dev/sda3 (50.0G - ext4 - "Debian")`
	if got != want {
		t.Errorf("DisplayString = %q, want %q", got, want)
	}
}
