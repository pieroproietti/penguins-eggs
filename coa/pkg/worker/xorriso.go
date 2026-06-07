package worker

import (
	"fmt"
	"os"
	"os/exec"
)

// ... struct ActionXorriso rimane uguale ...

func RunXorriso(task ActionXorriso) error {
	p := task.Params

	// 0. LA MAGIA: Espansione delle variabili stile Bash
	// Trasforma le stringhe letterali come "${ISO_OUTPUT}" nei loro valori reali
	// pescando dalle variabili d'ambiente correnti.
	actualOutput := os.ExpandEnv(p.OutputFile)
	actualSource := os.ExpandEnv(p.SourceDir)

	// 1. Controlli di sicurezza (ora usiamo le variabili espanse)
	if actualOutput == "" || actualSource == "" {
		return fmt.Errorf("parametri output_file e source_dir sono obbligatori")
	}

	if _, err := os.Stat(actualSource); os.IsNotExist(err) {
		return fmt.Errorf("la directory sorgente '%s' non esiste", actualSource)
	}

	if p.Volid == "" {
		p.Volid = "OA_LIVE"
	}

	// 2. Costruzione sicura degli argomenti
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
		"-o", actualOutput, // <-- Usiamo la variabile espansa!
		actualSource, // <-- Usiamo la variabile espansa!
	}

	fmt.Printf("\n💿 Generazione ISO ibrida: %s\n", actualOutput)
	fmt.Printf("📁 Sorgente: %s\n", actualSource)
	fmt.Println("⏳ Avvio compressione xorriso (potrebbe richiedere qualche minuto)...")

	// 3. Esecuzione del processo nativo
	cmd := exec.Command("xorriso", args...)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("processo xorriso fallito: %w", err)
	}

	fmt.Printf("✅ Immagine ISO creata con successo in: %s\n", actualOutput)
	return nil
}
