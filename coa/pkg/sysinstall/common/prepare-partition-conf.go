package sysinstall

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

func PreparePartitionConf() error {
	tableType := getPartitionTableType()
	fsList := GetAvailableFS()

	dialect := "oa"
	currentDate := time.Now().Format("2006-01-02")
	availableFSYaml := "[\"" + strings.Join(fsList, "\", \"") + "\"]"

	btrfsSubvolumes := ""
	for _, fs := range fsList {
		if fs == "btrfs" {
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

	// RIPRISTINIAMO IL LAYOUT, MA SENZA IL BLOCCO efi: GLOBALE.
	// La GUI modificherà dinamicamente il valore di filesystem: "ext4" della partizione "root".
	var layoutYaml string
	if tableType == "gpt" {
		layoutYaml = `partitionLayout:
  - name: "efi"
    filesystem: "fat32"
    mountPoint: "/boot/efi"
    size: 300MiB
    attributes: [ "boot", "esp" ]
  - name: "root"
    filesystem: "ext4"
    mountPoint: "/"
    size: 100%`
	} else {
		layoutYaml = `partitionLayout:
  - name: "bios_grub"
    filesystem: "unformatted"
    size: 8MiB
    attributes: [ "bios_grub" ]
  - name: "root"
    filesystem: "ext4"
    mountPoint: "/"
    size: 100%`
	}

	config := fmt.Sprintf(`---
# partition.conf - Generato dinamicamente il %s
# Dialetto: %s | Filosofia: https://penguins-eggs.net/blog/eggs-bananas

defaultPartitionTableType: %s
defaultFileSystemType:  "ext4"
availableFileSystemTypes: %s

%s

%s

userSwapChoices: [none, small, suspend, file]
drawNestedPartitions: false
alwaysShowPartitionLabels: true
initialPartitioningChoice: none
initialSwapChoice: none

lvm:
  enable: false
`, currentDate, dialect, tableType, availableFSYaml, layoutYaml, btrfsSubvolumes)

	targetPath := InstallerDRoot + "/modules/partition.conf"
	os.MkdirAll(InstallerDRoot+"/modules", 0755)
	return os.WriteFile(targetPath, []byte(config), 0644)
}
