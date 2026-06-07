package worker

import (
	"fmt"
	"os"
	"os/exec"
)

// ActionXorriso mappa esattamente il payload JSON inviato dal tuo file YAML
type ActionXorriso struct {
	Name   string `json:"name"`
	Module string `json:"module"`
	Params struct {
		OutputFile  string `json:"output_file"`
		SourceDir   string `json:"source_dir"`
		Volid       string `json:"volid"`
		IsolinuxBin string `json:"isolinux_bin"`
		IsolinuxCat string `json:"isolinux_cat"`
		EfiImg      string `json:"efi_img"`
		Isohdpfx    string `json:"isohdpfx"`
	} `json:"params"`
}

// RunXorriso prende i parametri ed esegue il comando di masterizzazione
func RunXorriso(task ActionXorriso) error {
	p := task.Params

	// 1. Controlli di sicurezza: ti salvano dal lanciare un processo lungo
	//    se mancano i parametri fondamentali.
	if p.OutputFile == "" || p.SourceDir == "" {
		return fmt.Errorf("parametri output_file e source_dir sono obbligatori")
	}

	// Verifica immediata che la cartella da comprimere esista davvero
	if _, err := os.Stat(p.SourceDir); os.IsNotExist(err) {
		return fmt.Errorf("la directory sorgente '%s' non esiste", p.SourceDir)
	}

	// Default di fallback per il nome volume se non specificato nello YAML
	if p.Volid == "" {
		p.Volid = "OA_LIVE"
	}

	// 2. Costruzione sicura degli argomenti (nessun problema di string injection Bash!)
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
		"-o", p.OutputFile,
		p.SourceDir,
	}

	fmt.Printf("\n💿 Generazione ISO ibrida: %s\n", p.OutputFile)
	fmt.Printf("📁 Sorgente: %s\n", p.SourceDir)
	fmt.Println("⏳ Avvio compressione xorriso (potrebbe richiedere qualche minuto)...")

	// 3. Esecuzione del processo nativo
	cmd := exec.Command("xorriso", args...)

	// Colleghiamo lo standard output e error in modo trasparente.
	// Così l'utente vedrà le percentuali e i log di xorriso direttamente nel terminale!
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("processo xorriso fallito: %w", err)
	}

	fmt.Printf("✅ Immagine ISO creata con successo in: %s\n", p.OutputFile)
	return nil
}
