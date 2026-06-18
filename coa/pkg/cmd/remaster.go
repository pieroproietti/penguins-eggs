package cmd

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"coa/pkg/config"
	"coa/pkg/distro"
	"coa/pkg/parser"
	"coa/pkg/planner"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
	"golang.org/x/term"
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
	Short: "Start a system remastering flight (ISO production)",
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

		// Per la modalità crypted: chiede la passphrase e la salva in un file temporaneo
		if produceMode == "crypted" {
			password, err := promptLuksPassword()
			if err != nil {
				utils.Fatal("Errore passphrase LUKS: %v", err)
			}
			if err := os.MkdirAll(config.StagingDir, 0755); err != nil {
				utils.Fatal("Impossibile creare %s: %v", config.StagingDir, err)
			}
			if err := os.WriteFile(config.LuksKeyFile, []byte(password), 0600); err != nil {
				utils.Fatal("Impossibile salvare la passphrase LUKS: %v", err)
			}
			utils.LogSuccess("Passphrase LUKS salvata.")
		}

		// 1. Il ponte di comando valuta la situazione (Il Sensore)
		isGitHubAction := false
		if _, err := os.Stat("/home/runner/work"); !os.IsNotExist(err) {
			isGitHubAction = true
		}

		// 1. Identità: Chi siamo?
		myDistro := distro.NewDistro()
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
		utils.EnsureBootloaders(config.BootloadersDir)

		// GENERAZIONE EXCLUSIONI
		utils.LogNormal("Generazione lista di esclusione (%s mode)...", produceMode)
		planner.GenerateExcludeList(produceMode, isGitHubAction)

		// 3. planner: Generiamo il piano JSON per oa
		planPath, err := planner.GeneratePlan(
			profile, // <-- L'intero oggetto che contiene Settings e Remaster
			myDistro.FamilyID,
			isGitHubAction,
			true,
			producePath,
			finalIsoPath,
			stopAfter,
			debugPlan, // <--- Passiamo il flag anche all'planner
			produceMode,
		)
		if err != nil {
			utils.Fatal("Impossibile generare il piano di volo: %v", err)
		}

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
	remasterCmd.Flags().StringVar(&producePath, "path", config.DefaultWorkPath, "working directory")
	remasterCmd.Flags().BoolVar(&cloneFlag, "clone", false, "Clona il sistema preservando utenti e /home")
	remasterCmd.Flags().BoolVar(&cryptedFlag, "crypted", false, "Crea una ISO con filesystem.squashfs cifrato in LUKS")
	remasterCmd.Flags().StringVar(&stopAfter, "stop-after", "", "Ferma l'esecuzione dopo uno step specifico (es. coa-initrd)")
	remasterCmd.Flags().BoolVar(&debugPlan, "debug", false, "Stampa il piano JSON ed esce senza masterizzare")

	rootCmd.AddCommand(remasterCmd)
}

// promptLuksPassword chiede la passphrase LUKS due volte con echo disabilitato.
func promptLuksPassword() (string, error) {
	if !term.IsTerminal(int(os.Stdin.Fd())) {
		// Modalità non-interattiva: leggi da stdin senza echo
		scanner := bufio.NewScanner(os.Stdin)
		if scanner.Scan() {
			return strings.TrimRight(scanner.Text(), "\r\n"), nil
		}
		return "", fmt.Errorf("impossibile leggere la passphrase da stdin")
	}

	fmt.Print("Inserisci la passphrase LUKS: ")
	pass1, err := term.ReadPassword(int(os.Stdin.Fd()))
	if err != nil {
		return "", fmt.Errorf("errore lettura passphrase: %v", err)
	}
	fmt.Println()

	fmt.Print("Conferma la passphrase LUKS:  ")
	pass2, err := term.ReadPassword(int(os.Stdin.Fd()))
	if err != nil {
		return "", fmt.Errorf("errore lettura conferma: %v", err)
	}
	fmt.Println()

	if string(pass1) != string(pass2) {
		return "", fmt.Errorf("le passphrase non corrispondono")
	}
	if len(pass1) < 8 {
		return "", fmt.Errorf("la passphrase deve avere almeno 8 caratteri")
	}
	return string(pass1), nil
}
