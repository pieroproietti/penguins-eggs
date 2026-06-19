package cmd

import (
	"bytes"
	"os"
	"os/exec"
	"path/filepath"

	"coa/pkg/pathDefaults"
	"coa/pkg/distro"
	"coa/pkg/parser"
	"coa/pkg/planner"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var (
	producePath string
	stopAfter   string
	debugPlan   bool
	cloneFlag   bool
	cryptedFlag bool
)

var remasterCmd = &cobra.Command{
	Use:   "remaster",
	Short: "Start a system remastering (ISO production)",
	Long: `The 'remaster' command orchestrates the creation of a bootable live ISO. 
It uses the new Coala architecture to read the agnostic Brain profile 
and generate a precise execution plan for the OA planner.`,
	Example: `  # Standard ISO remastering
  sudo ./coa remaster

  # Clone mode (preserves users and /home)
  sudo ./coa remaster --clone

  # Crypted mode (LUKS-encrypted squashfs)
  sudo ./coa remaster --crypted

  # Debug mode: stop after a specific step
  sudo ./coa remaster --stop-after coa-initrd

  # Print the generated JSON plan and exit
  sudo ./coa remaster --debug`,
	Run: func(cmd *cobra.Command, args []string) {
		CheckSudoRequirements(cmd.Name(), true)

		if cloneFlag && cryptedFlag {
			utils.Fatal("I flag --clone e --crypted sono mutuamente esclusivi.")
		}

		produceMode := "standard"
		if cloneFlag {
			produceMode = "clone"
		} else if cryptedFlag {
			produceMode = "crypted"
		}

		utils.LogNormal("Avvio procedura di rimasterizzazione (mode: %s)...", produceMode)

		// 1. Identità: Chi siamo?
		myDistro := distro.NewDistro()

		if produceMode == "crypted" && myDistro.FamilyID != "debian" {
			utils.Fatal("L'opzione --crypted è disponibile solo per la famiglia Debian (rilevata: %s).", myDistro.DistroLike)
		}

		// Per la modalità crypted: chiede passphrase e configurazione crypto
		var luksPassphrase string
		if produceMode == "crypted" {
			if err := os.MkdirAll(pathDefaults.StagingDir, 0755); err != nil {
				utils.Fatal("Impossibile creare %s: %v", pathDefaults.StagingDir, err)
			}

			var err error
			luksPassphrase, err = promptLuksPassword()
			if err != nil {
				utils.Fatal("Errore passphrase LUKS: %v", err)
			}
			utils.LogSuccess("Passphrase LUKS acquisita (non verrà scritta su disco).")

			cryptoCfg := promptCryptoConfig()
			if err := saveCryptoConfig(cryptoCfg); err != nil {
				utils.Fatal("Impossibile salvare la configurazione crypto: %v", err)
			}
			utils.LogSuccess("Configurazione crypto salvata.")
		}

		// 1. Il ponte di comando valuta la situazione (Il Sensore)
		isGitHubAction := false
		if _, err := os.Stat("/home/runner/work"); !os.IsNotExist(err) {
			isGitHubAction = true
		}

		isoName := myDistro.GetISOName(produceMode)

		finalIsoPath := filepath.Join(producePath, isoName)
		utils.LogNormal("L'uovo verrà generato in: %s", finalIsoPath)

		// 2. PARSER: Carichiamo lo spartito dal Brain
		profile, err := parser.DetectAndLoad(isGitHubAction)
		if err != nil {
			utils.Fatal("Impossibile caricare il Brain Profile: %v", err)
		}
		utils.LogSuccess("Spartito caricato con successo.")

		// RECUPERO BOOTLOADERS
		utils.LogNormal("Recupero bootloaders (penguins-bootloaders)...")
		utils.EnsureBootloaders(pathDefaults.BootloadersDir)

		// GENERAZIONE EXCLUSIONI
		utils.LogNormal("Generazione lista di esclusione (%s mode)...", produceMode)
		planner.GenerateExcludeList(produceMode, isGitHubAction)

		// 3. planner: Generiamo il piano JSON per oa
		planPath, planJSON, err := planner.GeneratePlan(
			profile,
			myDistro.FamilyID,
			isGitHubAction,
			true,
			producePath,
			finalIsoPath,
			stopAfter,
			debugPlan,
			produceMode,
			luksPassphrase,
		)
		if err != nil {
			utils.Fatal("Impossibile generare il piano di volo: %v", err)
		}

		// 4. DECOLLO: Eseguiamo il motore C (oa) passandogli il piano
		utils.LogNormal("Passaggio dei comandi al motore OA...")

		var oaCmd *exec.Cmd
		if produceMode == "crypted" {
			// Modalità crypted: il piano passa via stdin, niente file su disco
			oaCmd = exec.Command("oa")
			oaCmd.Stdin = bytes.NewReader(planJSON)
		} else {
			oaCmd = exec.Command("oa", planPath)
		}

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

var produceCmd = &cobra.Command{
	Use:   "produce",
	Short: "Alias for remaster (penguins-eggs compatibility)",
	Run:   remasterCmd.Run,
}

func init() {
	remasterCmd.Flags().StringVar(&producePath, "path", pathDefaults.DefaultWorkPath, "working directory")
	remasterCmd.Flags().BoolVar(&cloneFlag, "clone", false, "Clona il sistema preservando utenti e /home")
	remasterCmd.Flags().BoolVar(&cryptedFlag, "crypted", false, "Crea una ISO con filesystem.squashfs cifrato in LUKS")
	remasterCmd.Flags().StringVar(&stopAfter, "stop-after", "", "Ferma l'esecuzione dopo uno step specifico (es. coa-initrd)")
	remasterCmd.Flags().BoolVar(&debugPlan, "debug", false, "Stampa il piano JSON ed esce senza masterizzare")

	produceCmd.Flags().StringVar(&producePath, "path", pathDefaults.DefaultWorkPath, "working directory")
	produceCmd.Flags().BoolVar(&cloneFlag, "clone", false, "Clona il sistema preservando utenti e /home")
	produceCmd.Flags().BoolVar(&cryptedFlag, "crypted", false, "Crea una ISO con filesystem.squashfs cifrato in LUKS")
	produceCmd.Flags().StringVar(&stopAfter, "stop-after", "", "Ferma l'esecuzione dopo uno step specifico (es. coa-initrd)")
	produceCmd.Flags().BoolVar(&debugPlan, "debug", false, "Stampa il piano JSON ed esce senza masterizzare")

	rootCmd.AddCommand(remasterCmd)
	rootCmd.AddCommand(produceCmd)
}

