package setup

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// PartitionConfig contiene i dati da iniettare nel template YAML
type PartitionConfig struct {
	Date        string
	Dialect     string
	TableType   string
	AvailableFS string
	HasBtrfs    bool
	IsUEFI      bool
}

// Rileva se siamo su UEFI o BIOS
func getPartitionTableType() string {
	if _, err := os.Stat("/sys/firmware/efi"); err == nil {
		return "gpt"
	}
	return "msdos"
}

// Rileva i filesystem realmente supportati dal sistema live
func GetAvailableFS() []string {
	candidates := []string{"ext4", "btrfs", "xfs", "f2fs", "jfs", "reiser"}
	var available []string

	for _, fs := range candidates {
		if _, err := exec.LookPath("mkfs." + fs); err == nil {
			available = append(available, fs)
		}
	}

	if len(available) == 0 {
		available = append(available, "ext4")
	}
	return available
}

func partitionConf() error {
	tableType := getPartitionTableType()
	fsList := GetAvailableFS()

	// Controlla se btrfs è tra i filesystem disponibili
	hasBtrfs := false
	for _, fs := range fsList {
		if fs == "btrfs" {
			hasBtrfs = true
			break
		}
	}

	// Popoliamo i dati per il template
	config := PartitionConfig{
		Date:        time.Now().Format("2006-01-02"),
		Dialect:     "oa",
		TableType:   tableType,
		AvailableFS: `["` + strings.Join(fsList, `", "`) + `"]`, // Formatta come array JSON
		HasBtrfs:    hasBtrfs,
		IsUEFI:      tableType == "gpt",
	}

	targetPath := filepath.Join(InstallerDRoot, "modules", "partition.conf")
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		return err
	}

	// Usa l'helper che pesca direttamente da embed.FS (lo stesso del bootloader!)
	return renderAndSaveEmbedded("partition.conf.tmpl", targetPath, config, 0644)
}
