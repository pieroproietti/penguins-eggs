package calamares

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"
)

// getPartitionTableType rileva se il sistema è avviato in modalità UEFI o BIOS
func getPartitionTableType() string {
	// Verifichiamo se la directory EFI esiste per distinguere GPT da MSDOS
	if _, err := os.Stat("/sys/firmware/efi"); err == nil {
		return "gpt"
	}
	// Fallback per macchine BIOS/Legacy
	return "msdos"
}

// GetAvailableFS scansiona il sistema alla ricerca dei tool mkfs.* effettivamente installati
func GetAvailableFS() []string {
	// I candidati supportati da Calamares/KPMCore
	candidates := []string{"ext4", "btrfs", "xfs", "f2fs", "jfs", "reiser"}
	var available []string

	for _, fs := range candidates {
		// Cerchiamo se esiste mkfs.nomefilesystem nel PATH di sistema
		if _, err := exec.LookPath("mkfs." + fs); err == nil {
			available = append(available, fs)
		}
	}

	// Fail-safe: se non trova nulla, garantiamo almeno ext4
	if len(available) == 0 {
		available = append(available, "ext4")
	}
	return available
}

// PreparePartitionConf genera il file di configurazione dinamico per il modulo partition
func PreparePartitionConf() error {
	// 1. Rileviamo l'ambiente hardware e software
	tableType := getPartitionTableType()
	fsList := GetAvailableFS()

	// Usiamo il dialetto 'oa' per il nome del sistema
	dialect := "oa"
	currentDate := time.Now().Format("2006-01-02")
	availableFSYaml := "[\"" + strings.Join(fsList, "\", \"") + "\"]"

	// 2. Prepariamo il template YAML
	// Nota: Il blocco 'partitionLayout' risolve il problema dello spazio grigio
	// forzando la creazione di una partizione root al 100%
	config := fmt.Sprintf(`---
# partition.conf - Generato dinamicamente il %s
# Dialetto: %s | Filosofia: https://penguins-eggs.net/blog/eggs-bananas

# Forza la tabella corretta rilevata dal sarto: %s
defaultPartitionTableType: %s

# Configurazione del layout automatico (Risolve il problema delle barre grigie)
partitionLayout:
    - name: "root"
      filesystem: "%s"
      mountPoint: "/"
      size: 100%%

efi:
  mountPoint: "/boot/efi"
  recommendedSize: 300MiB
  minimumSize: 32MiB
  label: "EFI"

# Filesystem e opzioni di swap
defaultFileSystemType:  "%s"
availableFileSystemTypes: %s

userSwapChoices: [none, small, suspend, file]
luksGeneration: luks1
drawNestedPartitions: false
alwaysShowPartitionLabels: true
initialPartitioningChoice: none
initialSwapChoice: none

lvm:
  enable: true
`, currentDate, dialect, tableType, tableType, fsList[0], fsList[0], availableFSYaml)

	// 3. Scrittura del file nel percorso di Calamares
	targetPath := oaInstallerRoot + "/modules/partition.conf"

	// Assicuriamoci che la directory esista
	if err := os.MkdirAll(oaInstallerRoot+"/modules", 0755); err != nil {
		return err
	}

	return os.WriteFile(targetPath, []byte(config), 0644)
}
