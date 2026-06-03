package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"coa/pkg/distro" // Importiamo il tuo pacchetto per rilevare l'host

	"github.com/spf13/cobra"
)

// grub40Cmd represents the 'coa tools grub40' command
var grub40Cmd = &cobra.Command{
	Use:   "grub40 [path/to/iso]",
	Short: "Generate GRUB configuration to boot an ISO via loopback",
	Long:  `Calculates the exact path of the ISO for GRUB (handling BTRFS subvolumes and separate mount points), detects its size, and prints the configuration block.`,
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {

		isoPath := args[0]

		// 1. Ottiene il percorso assoluto dal punto di vista del sistema host
		absPath, err := filepath.Abs(isoPath)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error calculating absolute path: %v\n", err)
			os.Exit(1)
		}

		// 2. Verifica l'esistenza del file e ne legge la dimensione
		info, err := os.Stat(absPath)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: cannot access file (are you sure it exists?): %v\n", err)
			os.Exit(1)
		}

		sizeBytes := info.Size()
		var sizeStr string
		if sizeBytes >= 1024*1024*1024 {
			sizeStr = fmt.Sprintf("%.2f GB", float64(sizeBytes)/(1024*1024*1024))
		} else {
			sizeStr = fmt.Sprintf("%.2f MB", float64(sizeBytes)/(1024*1024))
		}

		isoName := filepath.Base(absPath)

		// 3. Calcola il percorso reale che GRUB si aspetta (gestione BTRFS e Mount Point)
		grubPath := calculateGrubPath(absPath)

		// 4. CONTROLLO ANTI-FRUSTRAZIONE: Verifica se l'host usa effettivamente GRUB
		detectBootloader()

		// 5. RILEVAMENTO DISTRO: Personalizza il comando di aggiornamento di GRUB
		d := distro.NewDistro()
		updateCmd := "sudo grub-mkconfig -o /boot/grub/grub.cfg"

		// NOTA: Ipotizzo che il tuo pacchetto distro esponga la proprietà `.ID` o `.Name` in minuscolo.
		// Adattala se nel tuo struct usi un nome diverso (es: myDistro.Family o myDistro.Name).
		distroID := strings.ToLower(d.DistroID)
		if distroID == "debian" || distroID == "ubuntu" || distroID == "linuxmint" || distroID == "pop" {
			updateCmd = "sudo update-grub"
		}

		// Il template del blocco GRUB universale in inglese con il segnaposto per il comando
		grubTemplate := `
# oa-tools %s
# Add to /etc/grub.d/40_custom and run: '%s'
# Universal: boots any oa-tools ISO on any host OS.
#
# File: %s
# Detected size: %s

menuentry "oa-tools: %s" --class isoboot {
    insmod part_gpt
    insmod part_msdos
    insmod ext2
    insmod btrfs
    insmod iso9660
    insmod loopback

    set isofile="%s"

    search --no-floppy --set=root --file $isofile
    loopback loop $isofile

    linux (loop)/live/vmlinuz boot=live components rootwait findiso=$isofile
    initrd (loop)/live/initrd.img
}
`
		// Stampa il risultato passando i parametri nell'ordine corretto
		fmt.Printf(grubTemplate, AppVersion, updateCmd, isoName, sizeStr, isoName, grubPath)
	},
}

// Logica intelligente per mappare il percorso reale per GRUB analizzando i mount point dell'host
func calculateGrubPath(absPath string) string {
	data, err := os.ReadFile("/proc/mounts")
	if err != nil {
		return absPath // Fallback al percorso assoluto standard in caso di errore
	}

	type Mount struct {
		Point   string
		FSType  string
		Options []string
	}

	var mounts []Mount
	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) < 4 {
			continue
		}
		mounts = append(mounts, Mount{
			Point:   fields[1],
			FSType:  fields[2],
			Options: strings.Split(fields[3], ","),
		})
	}

	// Troviamo il mount point più specifico (più lungo) che contiene il nostro file
	var bestMatch Mount
	bestMatchLen := -1

	for _, m := range mounts {
		if m.Point == "/" {
			if bestMatchLen < 0 {
				bestMatch = m
				bestMatchLen = 0
			}
		} else if strings.HasPrefix(absPath, m.Point) {
			if len(absPath) == len(m.Point) || absPath[len(m.Point)] == '/' {
				if len(m.Point) > bestMatchLen {
					bestMatch = m
					bestMatchLen = len(m.Point)
				}
			}
		}
	}

	if bestMatchLen == -1 {
		return absPath
	}

	// Calcoliamo il percorso relativo rispetto al suo punto di montaggio
	relPath := absPath
	if bestMatch.Point != "/" {
		relPath = strings.TrimPrefix(absPath, bestMatch.Point)
	}
	if !strings.HasPrefix(relPath, "/") {
		relPath = "/" + relPath
	}

	// Se il filesystem è BTRFS, dobbiamo estrarre il subvolume e metterlo come prefisso
	if bestMatch.FSType == "btrfs" {
		subvol := ""
		for _, opt := range bestMatch.Options {
			if strings.HasPrefix(opt, "subvol=") {
				subvol = strings.TrimPrefix(opt, "subvol=")
				break
			}
		}
		if subvol != "" && subvol != "/" {
			subvol = strings.TrimSuffix(subvol, "/")
			return subvol + relPath
		}
	}

	return relPath
}

// detectBootloader controlla se il sistema host supporta GRUB e avvisa l'utente in caso contrario
func detectBootloader() {
	_, errGrub := os.Stat("/etc/grub.d")
	_, errSdBoot := os.Stat("/boot/efi/loader/loader.conf")
	_, errSdEntries := os.Stat("/efi/loader/loader.conf")

	if os.IsNotExist(errGrub) {
		fmt.Fprintln(os.Stderr, "\033[1;33m[WARNING]\033[0m /etc/grub.d was not found. This host does not seem to use GRUB.")

		if errSdBoot == nil || errSdEntries == nil {
			fmt.Fprintln(os.Stderr, "\033[1;33m[INFO]\033[0m Detected systemd-boot framework. Note that systemd-boot does NOT natively support ISO loopback loading.")
		}

		fmt.Fprintln(os.Stderr, "\033[1;33m[INFO]\033[0m The configuration below is generated anyway, but it will only work on a GRUB-managed target machine.\n")
	}
}

func init() {
	toolsCmd.AddCommand(grub40Cmd)
}
