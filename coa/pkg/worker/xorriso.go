// worker/xorriso.go
package worker

import (
	"coa/pkg/pathDefaults"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// RunXorriso genera l'immagine ISO ibrida finale.
// Riceve i parametri crudi dal dispatcher e li decodifica in autonomia.
func RunXorriso(payload []byte) error {
	// 1. Struttura locale isolata per il modulo xorriso
	var cfg struct {
		Params struct {
			OutputFile  string `json:"output_file"`
			SourceDir   string `json:"source_dir"`
			Volid       string `json:"volid"`
			IsolinuxBin string `json:"isolinux_bin"`
			IsolinuxCat string `json:"isolinux_cat"`
			Isohdpfx    string `json:"isohdpfx"`
			EfiImg      string `json:"efi_img"`
		} `json:"params"`
	}

	// 2. Apriamo il pacco ricevuto dal dispatcher
	if err := json.Unmarshal(payload, &cfg); err != nil {
		return fmt.Errorf("errore parsing JSON per modulo xorriso: %w", err)
	}

	p := cfg.Params

	// 3. Espansione classica delle variabili d'ambiente
	actualOutput := os.ExpandEnv(p.OutputFile)

	// FALLBACK DI SICUREZZA:
	// Se dopo l'espansione è ancora vuoto, usiamo un path predefinito basato sulla home
	if actualOutput == "" || actualOutput == "${ISO_OUTPUT}" {
		actualOutput = filepath.Join(pathDefaults.DefaultWorkPath, "oa-live.iso")
		fmt.Printf("⚠️  [worker] Warning: ISO_OUTPUT non risolto, uso fallback: %s\n", actualOutput)
	}

	actualSource := os.ExpandEnv(p.SourceDir)
	if actualSource == "" {
		actualSource = filepath.Join(pathDefaults.DefaultWorkPath, "isodir")
	}

	// 4. Controlli di sicurezza base
	if actualOutput == "" || actualSource == "" {
		return fmt.Errorf("modulo xorriso: parametri 'output_file' e 'source_dir' non validi")
	}

	if _, err := os.Stat(actualSource); os.IsNotExist(err) {
		return fmt.Errorf("modulo xorriso: la directory sorgente '%s' non esiste", actualSource)
	}

	if p.Volid == "" {
		p.Volid = "OA_LIVE"
	}

	// Verifica rapida dei binari di boot (evita che xorriso fallisca malamente dopo)
	if p.IsolinuxBin == "" || p.EfiImg == "" {
		fmt.Println("⚠️  [worker] Warning: boot parameters (isolinux_bin or efi_img) missing. The ISO may not boot.")
	}

	// 5. Costruzione sicura degli argomenti
	args := []string{
		"-as", "mkisofs",
		"-iso-level", "3",
		"-full-iso9660-filenames",
		"-volid", p.Volid,

		// Boot Legacy (ISOLINUX)
		"-eltorito-boot", p.IsolinuxBin,
		"-eltorito-catalog", p.IsolinuxCat,
		"-no-emul-boot",
		"-boot-load-size", "4",
		"-boot-info-table",
		"-isohybrid-mbr", p.Isohdpfx,

		// Boot UEFI
		"-eltorito-alt-boot",
		"-e", p.EfiImg,
		"-no-emul-boot",
		"-isohybrid-gpt-basdat",

		// Output file e Cartella Sorgente
		"-o", actualOutput,
		actualSource,
	}

	// 6. Output visivo
	fmt.Printf("\n💿 [worker] Generating hybrid ISO: %s\n", actualOutput)
	fmt.Printf("📁 [worker] Sorgente: %s\n", actualSource)
	fmt.Println("⏳ [worker] Starting xorriso compression (this may take a few minutes)...")

	// 7. Esecuzione del processo nativo
	cmd := exec.Command("xorriso", args...)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("xorriso process failed: %w", err)
	}

	fmt.Printf("✅ [worker] ISO image created successfully at: %s\n", actualOutput)
	return nil
}
