package calamares

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"
)

// 1. Rileva se siamo su UEFI o BIOS (La tua funzione intatta)
func getPartitionTableType() string {
	if _, err := os.Stat("/sys/firmware/efi"); err == nil {
		return "gpt"
	}
	return "msdos"
}

// 2. Rileva i filesystem realmente supportati dal sistema live (La tua funzione intatta)
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

// 3. Genera il file di configurazione con il layout dinamico (Quella aggiornata)
func PreparePartitionConf() error {
	tableType := getPartitionTableType()
	fsList := GetAvailableFS() // <-- Qui chiama la tua funzione perfetta!

	dialect := "oa"
	currentDate := time.Now().Format("2006-01-02")
	availableFSYaml := "[\"" + strings.Join(fsList, "\", \"") + "\"]"

	defaultFs := fsList[0]
	btrfsSubvolumes := ""

	for _, fs := range fsList {
		if fs == "btrfs" {
			defaultFs = "btrfs"
			btrfsSubvolumes = `
# Regole di subvolume essenziali per BTRFS
btrfs:
    - mountPoint: /
      subvolume: /@
    - mountPoint: /home
      subvolume: /@home
    - mountPoint: /var/cache
      subvolume: /@cache
    - mountPoint: /var/log
      subvolume: /@log
`
			break
		}
	}

	var layoutYaml string
	if tableType == "gpt" {
		layoutYaml = fmt.Sprintf(`partitionLayout:
    - name: "efi"
      filesystem: "fat32"
      mountPoint: "/boot/efi"
      size: 300MiB
      attributes: [ "boot", "esp" ]
    - name: "root"
      filesystem: "%s"
      mountPoint: "/"
      size: 100%%`, defaultFs)
	} else {
		layoutYaml = fmt.Sprintf(`partitionLayout:
    - name: "bios_grub"
      filesystem: "unformatted"
      size: 8MiB
      attributes: [ "bios_grub" ]
    - name: "root"
      filesystem: "%s"
      mountPoint: "/"
      size: 100%%`, defaultFs)
	}

	config := fmt.Sprintf(`---
# partition.conf - Generato dinamicamente il %s
# Dialetto: %s | Filosofia: https://penguins-eggs.net/blog/eggs-bananas

defaultPartitionTableType: %s

%s

efi:
  mountPoint: "/boot/efi"
  recommendedSize: 300MiB
  minimumSize: 32MiB
  label: "EFI"

defaultFileSystemType:  "%s"
availableFileSystemTypes: %s
%s
userSwapChoices: [none, small, suspend, file]
luksGeneration: luks1
drawNestedPartitions: false
alwaysShowPartitionLabels: true
initialPartitioningChoice: none
initialSwapChoice: none

lvm:
  enable: true
`, currentDate, dialect, tableType, layoutYaml, defaultFs, availableFSYaml, btrfsSubvolumes)

	targetPath := oaInstallerRoot + "/modules/partition.conf"
	os.MkdirAll(oaInstallerRoot+"/modules", 0755)
	return os.WriteFile(targetPath, []byte(config), 0644)
}
