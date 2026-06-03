package cmd

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"coa/pkg/distro" // Importiamo il tuo pacchetto per rilevare l'host

	"github.com/spf13/cobra"
)

// Variabile di stato per agganciare il flag di scrittura automatica
var writeToGrub bool

// grub40Cmd represents the 'coa tools grub40' command
var grub40Cmd = &cobra.Command{
	Use:   "grub40 [path/to/iso]",
	Short: "Generate GRUB configuration to boot an ISO via loopback",
	Long:  `Calculates the exact path of the ISO for GRUB (handling BTRFS subvolumes and separate mount points), detects its size, and prints or directly injects the configuration block into /etc/grub.d/40_custom.`,
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

		// 5. RILEVAMENTO DISTRO HOST: Personalizza il comando di aggiornamento di GRUB
		updateCmd := "sudo grub-mkconfig -o /boot/grub/grub.cfg"
		d := distro.NewDistro()
		distroID := strings.ToLower(d.DistroLike)
		if distroID == "debian" {
			updateCmd = "sudo update-grub"
		} else if distroID == "fedora" || distroID == "opensuse" {
			updateCmd = "sudo grub-mkconfig -o /boot/grub2/grub.cfg"
		}

		// 6. ISPEZIONE ISO TARGET VIA BSDTAR: Rileva se la ISO interna è Arch, Debian, Fedora o Alpine
		kernelParams := extractOaKernelParams(absPath)

		// 7. GENERAZIONE DEI MARCATORI UNICI PER QUESTA ISO
		startMarker := fmt.Sprintf("# >>> oa-tools start: %s <<<", isoName)
		endMarker := fmt.Sprintf("# >>> oa-tools end: %s <<<", isoName)

		// Costruiamo il blocco pulito nativo di GRUB racchiuso tra i suoi marcatori di sosta
		grubEntry := fmt.Sprintf(`%s
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

    linux (loop)/live/vmlinuz %s
    initrd (loop)/live/initrd.img
}
%s`, startMarker, isoName, grubPath, kernelParams, endMarker)

		// 8. LOGICA DI SCRITTURA DIRETTA O CONSULTAZIONE STANDARD
		if writeToGrub {
			// Il salvagente di root: toccare i file in /etc/grub.d richiede l'autorizzazione massima
			if os.Geteuid() != 0 {
				fmt.Fprintln(os.Stderr, "\033[1;31m[ERRORE]\033[0m L'iniezione automatica richiede i privilegi di root. Rilancia il comando con 'sudo'.")
				os.Exit(1)
			}

			targetFile := "/etc/grub.d/40_custom"

			// Leggiamo il file attuale; se non esiste lo inizializziamo col suo schema 'tail' standard
			contentBytes, err := os.ReadFile(targetFile)
			var content string
			if err != nil {
				content = "#!/bin/sh\nexec tail -n +3 $0\n# This file provides an easy way to add custom menu entries.  Simply type the\n# menu entries you want to add after this comment.  Be careful not to change\n# the 'exec tail' line above.\n"
			} else {
				content = string(contentBytes)
			}

			// SOSTITUZIONE CHIRURGICA: Se esisteva già un blocco per questa specifica ISO, lo radiamo al suolo
			if strings.Contains(content, startMarker) && strings.Contains(content, endMarker) {
				startIndex := strings.Index(content, startMarker)
				endIndex := strings.Index(content, endMarker) + len(endMarker)
				content = content[:startIndex] + content[endIndex:]
			}

			// APPEND PULITO: Agganciamo il nuovo blocco in coda ripulendo gli spazi vuoti di troppo
			content = strings.TrimSpace(content) + "\n\n" + grubEntry + "\n"

			// Scrittura finale mantenendo tassativamente i permessi di esecuzione originali (0755)
			err = os.WriteFile(targetFile, []byte(content), 0755)
			if err != nil {
				fmt.Fprintf(os.Stderr, "\033[1;31m[ERRORE]\033[0m Scrittura fallita su %s: %v\n", targetFile, err)
				os.Exit(1)
			}

			fmt.Printf("\033[1;32m[SUCCESS]\033[0m Entry per '%s' configurata con successo in %s.\n", isoName, targetFile)
			fmt.Printf("\033[1;34m[INFO]\033[0m Per rendere effettive le modifiche esegui: '%s'\n", updateCmd)

		} else {
			// Comportamento classico: stampiamo il blocco descrittivo sulla console
			grubTemplate := `
# oa-tools %s
# Add to /etc/grub.d/40_custom or run with '--write' to inject automatically.
# Update GRUB with: '%s'
#
# File: %s
# Detected size: %s

` + grubEntry + "\n"
			fmt.Printf(grubTemplate, AppVersion, updateCmd, isoName, sizeStr)
		}
	},
}

// Logic to extract parameters by inspecting the internal files of the target ISO via bsdtar
func extractOaKernelParams(isoPath string) string {
	// Tentativo A: Lettura di boot/grub/grub.cfg usando bsdtar (senza lo slash iniziale)
	cmd := exec.Command("bsdtar", "-O", "-xf", isoPath, "boot/grub/grub.cfg")
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &bytes.Buffer{} // Silenziamo l'output se il file non esiste (es. ISO solo legacy)

	_ = cmd.Run()

	// Tentativo B: Fallback su isolinux/isolinux.cfg se GRUB manca
	if out.Len() == 0 {
		cmd = exec.Command("bsdtar", "-O", "-xf", isoPath, "isolinux/isolinux.cfg")
		cmd.Stdout = &out
		cmd.Stderr = &bytes.Buffer{}
		_ = cmd.Run()
	}

	configText := out.String()

	// 1. FIRMA ARCH LINUX (Kiro / Archiso)
	if strings.Contains(configText, "archisobasedir") {
		return "archisobasedir=arch archisolabel=OA_LIVE img_loop=$isofile cow_spacesize=2G"
	}

	// 2. FIRMA FEDORA (Dracut Live Image)
	if strings.Contains(configText, "rd.live.image") || strings.Contains(configText, "root=live:") {
		return "root=live:CDLABEL=OA_LIVE rd.live.image iso-scan.iso=$isofile rootwait"
	}

	// 3. FIRMA ALPINE LINUX (Alpine Initfs)
	if strings.Contains(configText, "alpine_dev") || strings.Contains(configText, "modules=loop") {
		return "alpine_dev=loop img_loop=$isofile modules=loop,squashfs,sd-mod,usb-storage quiet"
	}

	// 4. FALLBACK PREDEFINITO: Standard live-boot per Debian, Ubuntu e derivate eggs
	return "boot=live components rootwait findiso=$isofile"
}

// Logica intelligente per mappare il percorso reale per GRUB analizzando i mount point dell'host
func calculateGrubPath(absPath string) string {
	data, err := os.ReadFile("/proc/mounts")
	if err != nil {
		return absPath
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

	relPath := absPath
	if bestMatch.Point != "/" {
		relPath = strings.TrimPrefix(absPath, bestMatch.Point)
	}
	if !strings.HasPrefix(relPath, "/") {
		relPath = "/" + relPath
	}

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

// detectBootloader controlla in modo pragmatico se GRUB è configurato nell'host
func detectBootloader() {
	_, errGrub := os.Stat("/boot/grub")
	_, errGrub2 := os.Stat("/boot/grub2")

	if os.IsNotExist(errGrub) && os.IsNotExist(errGrub2) {
		fmt.Fprintln(os.Stderr, "\033[1;33m[WARNING]\033[0m GRUB directory was not found in /boot. This host does not seem to use GRUB.")
		fmt.Fprintln(os.Stderr, "\033[1;33m[INFO]\033[0m The configuration below is generated anyway, but it will only work on a GRUB-managed target machine.\n")
	}
}

func init() {
	// Registrazione del flag booleano nel sistema Cobra CLI
	grub40Cmd.Flags().BoolVarP(&writeToGrub, "write", "w", false, "Inject the menu entry directly into /etc/grub.d/40_custom")
	toolsCmd.AddCommand(grub40Cmd)
}
