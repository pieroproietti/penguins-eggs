package cmd

import (
	// <--- Aggiunto per intercettare pilot.ErrDebugMode
	"os"
	"os/exec"
	"path/filepath"

	"coa/pkg/distro"
	"coa/pkg/engine"
	"coa/pkg/pilot"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var (
	produceMode string
	producePath string
	stopAfter   string
	debugPlan   bool // <--- Nuova variabile per il flag di debug
)

var remasterCmd = &cobra.Command{
	Use:   "remaster",
	Short: "Start a system remastering flight (ISO production)",
	Long: `The 'remaster' command orchestrates the creation of a bootable live ISO. 
It uses the new Coala architecture to read the agnostic Brain profile 
and generate a precise execution plan for the OA engine.`,
	Example: `  # Start a standard ISO remastering
  sudo ./coa remaster --mode standard
  
  # Debug mode: stop after a specific step
  sudo ./coa remaster --stop-after coa-initrd
  
  # Print the generated JSON plan (or YAML) and exit
  sudo ./coa remaster --debug`,
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements(cmd.Name(), true)

		utils.LogNormal("Avvio procedura di rimasterizzazione...")

		// 1. Il ponte di comando valuta la situazione (Il Sensore)
		isGitHubAction := false
		if _, err := os.Stat("/home/runner/work"); !os.IsNotExist(err) {
			isGitHubAction = true
		}

		// 1. Identità: Chi siamo?
		myDistro := distro.NewDistro()
		isoName := myDistro.GetISOName()

		finalPath := filepath.Join(producePath, isoName)
		utils.LogNormal("L'uovo verrà generato in: %s", finalPath)

		// 2. PILOT: Carichiamo lo spartito dal Brain
		profile, err := pilot.DetectAndLoad(isGitHubAction)
		if err != nil {
			utils.Fatal("Impossibile caricare il Brain Profile: %v", err)
		}
		utils.LogSuccess("Spartito caricato con successo.")

		// 3. ENGINE: Generiamo il piano JSON per oa
		planPath, err := engine.GeneratePlan(
			profile, // <-- L'intero oggetto che contiene Settings e Remaster
			myDistro.FamilyID,
			isGitHubAction,
			true,
			producePath,
			finalPath,
			stopAfter,
			debugPlan, // <--- Passiamo il flag anche all'engine
		)
		if err != nil {
			utils.Fatal("Impossibile generare il piano di volo: %v", err)
		}

		// RECUPERO BOOTLOADERS
		utils.LogNormal("Recupero bootloaders (penguins-bootloaders)...")
		utils.EnsureBootloaders("/tmp/coa/bootloaders")

		// GENERAZIONE EXCLUSIONI
		utils.LogNormal("Generazione lista di esclusione (%s mode)...", produceMode)
		engine.GenerateExcludeList(produceMode, isGitHubAction)

		// 4. DECOLLO: Eseguiamo il motore C (oa) passandogli il JSON appena generato
		utils.LogNormal("Passaggio dei comandi al motore OA...")
		oaCmd := exec.Command("oa", planPath)

		// Colleghiamo l'output di oa direttamente al terminale dell'utente
		oaCmd.Stdout = os.Stdout
		oaCmd.Stderr = os.Stderr

		if err := oaCmd.Run(); err != nil {
			utils.Fatal("L'esecuzione di oa è fallita: %v", err)
		}

		// Vittoria finale: Differenziamo il messaggio se abbiamo usato il breakpoint
		if stopAfter != "" {
			utils.LogWarning("Breakpoint raggiunto e ambiente smontato in sicurezza. Pronto per l'ispezione! 🐧🔍")
		} else {
			utils.LogSuccess("Rimasterizzazione completata! L'uovo è pronto. 🐧🥚")
		}
	},
}

func init() {
	remasterCmd.Flags().StringVar(&produceMode, "mode", "standard", "standard, clone, or crypted")
	remasterCmd.Flags().StringVar(&producePath, "path", "/home/eggs", "working directory")

	// Registrazione del nuovo flag per il breakpoint
	remasterCmd.Flags().StringVar(&stopAfter, "stop-after", "", "Ferma l'esecuzione dopo uno step specifico (es. coa-initrd)")

	// Registrazione del flag di debug
	remasterCmd.Flags().BoolVar(&debugPlan, "debug", false, "Stampa il piano JSON (o lo YAML in caso di pre-processing) ed esce senza masterizzare")

	rootCmd.AddCommand(remasterCmd)
}
