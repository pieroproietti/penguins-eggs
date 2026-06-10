// worker/xorriso.go
package worker

import (
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
	var config struct {
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
	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("errore parsing JSON per modulo xorriso: %w", err)
	}

	p := config.Params

	// 3. Espansione classica delle variabili d'ambiente
	actualOutput := os.ExpandEnv(p.OutputFile)

	// FALLBACK DI SICUREZZA:
	// Se dopo l'espansione è ancora vuoto, usiamo un path predefinito basato sulla home
	if actualOutput == "" || actualOutput == "${ISO_OUTPUT}" {
		actualOutput = filepath.Join("/home/eggs/oa-live.iso")
		fmt.Printf("⚠️  [worker] Warning: ISO_OUTPUT non risolto, uso fallback: %s\n", actualOutput)
	}

	actualSource := os.ExpandEnv(p.SourceDir)
	if actualSource == "" {
		actualSource = "/home/eggs/isodir" // Fallback di sicurezza
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
		fmt.Println("⚠️  [worker] Warning: parametri di boot (isolinux_bin o efi_img) mancanti. La ISO potrebbe non avviarsi.")
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
	fmt.Printf("\n💿 [worker] Generazione ISO ibrida: %s\n", actualOutput)
	fmt.Printf("📁 [worker] Sorgente: %s\n", actualSource)
	fmt.Println("⏳ [worker] Avvio compressione xorriso (potrebbe richiedere qualche minuto)...")

	// 7. Esecuzione del processo nativo
	cmd := exec.Command("xorriso", args...)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("processo xorriso fallito: %w", err)
	}

	fmt.Printf("✅ [worker] Immagine ISO creata con successo in: %s\n", actualOutput)
	return nil
}
