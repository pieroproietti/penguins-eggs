package planner

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"coa/pkg/config"
	"coa/pkg/parser"
	"coa/pkg/utils"
)

// GeneratePlan converte lo YAML in JSON.
func GeneratePlan(
	profile *parser.Profile,
	familyID string,
	isGitHubAction bool,
	isRemaster bool,
	workPath string,
	finalIsoPath string,
	stopAfter string,
	isDebug bool,
	mode string) (string, error) { // <--- Nuovo parametro

	var plan OAPlan

	plan.IsGitHubAction = isGitHubAction
	plan.Settings = profile.Settings.Remaster

	var hitBreakpoint bool

	// Ora iteriamo su profile.Remaster
	for _, step := range profile.Remaster {

		if hitBreakpoint && step.Name != "cleanup" {
			continue
		}

		currentRunCommand := strings.TrimSpace(step.RunCommand)
		/*
			if strings.Contains(currentRunCommand, "${ISO_OUTPUT}") {
				currentRunCommand = strings.ReplaceAll(currentRunCommand, "${ISO_OUTPUT}", finalIsoPath)
			}
		*/

		currentDescription := step.Description
		if strings.Contains(currentDescription, "${ISO_NAME}") {
			currentDescription = strings.ReplaceAll(currentDescription, "${ISO_NAME}", filepath.Base(finalIsoPath))
		}

		switch step.Module {
		case "mount_logic":
			plan.Plan = append(plan.Plan, mountLogic(workPath, isGitHubAction, mode)...)

		case "users":
			// In modalità clone/crypted gli utenti reali arrivano già clonati
			// tramite il bind mount di /home: il modulo "users" va saltato
			// perché altrimenti sovrascriverebbe identità e password esistenti.
			if mode == "clone" || mode == "crypted" {
				utils.LogNormal("[ENGINE] Modalità '%s': utenti reali clonati da /home, salto il modulo 'users'.", mode)
			} else {
				plan.Plan = append(plan.Plan, oaUsers(plan.Settings, step, workPath)...)
			}

		case "umount":
			plan.Plan = append(plan.Plan, OATask{
				Step: parser.Step{
					Name:        "cleanup",
					Description: "cleanup build",
					Module:      "umount",
				},
				WorkDir: workPath,
			})

		case "oa-ell":
			task := OATask{
				Step:     step,
				LiveRoot: getActualLiveFs(workPath),
			}

			// Infine, accodiamo il task "arricchito" al piano
			plan.Plan = append(plan.Plan, task)

		default:
			// Modalità crypted: salta il modulo autologin-gui (nessun utente "live")
			if mode == "crypted" && step.Module == "autologin-gui" {
				utils.LogNormal("[ENGINE] Modalità crypted: salto autologin-gui.")
				continue
			}

			task := OATask{
				Step:     step,
				LiveRoot: getActualLiveFs(workPath),
			}
			task.Description = currentDescription
			task.RunCommand = currentRunCommand

			// Modalità crypted: sostituisce il passo initramfs con la prep LUKS
			if mode == "crypted" && task.Name == "initramfs" {
				plan.Plan = append(plan.Plan, luksInitrdPrepStep(workPath))
				utils.LogNormal("[ENGINE] Modalità crypted: initramfs sostituito con luksInitrdPrepStep.")
				continue
			}

			// Modalità crypted: sostituisce copy-kernel-initrd con la versione LUKS
			if mode == "crypted" && task.Name == "copy-kernel-initrd" {
				plan.Plan = append(plan.Plan, luksKernelCopyStep(workPath))
				utils.LogNormal("[ENGINE] Modalità crypted: copy-kernel-initrd sostituito con luksKernelCopyStep.")
				continue
			}

			// Modalità crypted: dopo mksquashfs, inietta il wrap LUKS
			if mode == "crypted" && task.Name == "mksquashfs" {
				plan.Plan = append(plan.Plan, task) // mksquashfs
				plan.Plan = append(plan.Plan, luksWrapStep(workPath))
				utils.LogNormal("[ENGINE] Modalità crypted: luksWrapStep iniettato dopo mksquashfs.")
				continue
			}

			// Modalità crypted: aggiunge live-media per LUKS ai boot params
			if mode == "crypted" && task.Name == "generate-boot-menus" {
				if args, ok := task.Params["args"].([]interface{}); ok && len(args) >= 2 {
					if bootParams, ok := args[1].(string); ok {
						args[1] = bootParams + " live-media=/dev/mapper/live-root"
					}
				}
				utils.LogNormal("[ENGINE] Modalità crypted: boot params aggiornati con live-media LUKS.")
			}

			// Prima di "coa-xorriso" inseriamo "coa-dot-disk"
			if task.Name == "xorriso" {
				task.Params["output_file"] = finalIsoPath
				task.Params["source_dir"] = filepath.Join(workPath, "isodir")

				// 2. Ora usiamo questi valori per creare lo script .disk
				// Dobbiamo estrarli con type assertion perché sono interfacce
				outputFile := task.Params["output_file"].(string)
				sourceDir := task.Params["source_dir"].(string)

				// Creazione script .disk (usiamo i valori appena iniettati)
				scriptContent := createDotDiskScript(sourceDir, filepath.Base(outputFile), "", "")
				plan.Plan = append(plan.Plan, OATask{
					Step: parser.Step{ // <--- I campi vanno dentro 'Step'!
						Name:        "coa-dot-disk",
						Description: "Creazione metadati .disk (Standard Debian per live-boot)",
						Module:      "shell",
						Params: map[string]interface{}{
							"command": scriptContent,
						},
					},
				})
				utils.LogNormal("\n[ENGINE] Iniezione metadati .disk completata per live-boot.")
			}

			// 2. Accodiamo FINALMENTE l'azione originale (squashfs, xorriso o altro)
			plan.Plan = append(plan.Plan, task)

		}

		if stopAfter != "" && step.Name == stopAfter {
			utils.LogNormal("\n[ENGINE] 🛑 Breakpoint '%s' elaborato.", step.Name)
			hitBreakpoint = true
		}
	}

	for i, task := range plan.Plan {
		// Se il YAML aveva previsto una WorkDir (qualsiasi essa sia), la sovrascriviamo d'autorità
		if task.WorkDir != "" {
			plan.Plan[i].WorkDir = workPath
		}

		// Se il YAML aveva previsto una LiveRoot, la sovrascriviamo con il percorso esatto
		if task.LiveRoot != "" {
			plan.Plan[i].LiveRoot = fmt.Sprintf("%s/liveroot", workPath)
		}

		// (Opzionale) Manteniamo la sicurezza sul chroot
		if task.Chroot && task.LiveRoot == "" {
			plan.Plan[i].LiveRoot = fmt.Sprintf("%s/liveroot", workPath)
		}
	}

	// =========================================================================
	// INTERCETTAZIONE DEBUG JSON
	// =========================================================================
	if isDebug {
		fmt.Println("\n====================================================================")
		fmt.Println("                     [oa-tools] DEBUG JSON PLAN                     ")
		fmt.Println("====================================================================")

		// Formattiamo il JSON in modo leggibile (pretty print)
		jsonDebug, _ := json.MarshalIndent(plan, "", "  ")
		fmt.Println(string(jsonDebug))

		fmt.Println("====================================================================")
		fmt.Println("[debug] Esecuzione interrotta dal flag --debug. Nessuna ISO generata.")
		os.Exit(0) // Qui ha senso uscire, perché siamo nell'engine!
	}

	return savePlan(plan)
}

func savePlan(plan OAPlan) (string, error) {
	fullPath := config.PlanFile

	if err := os.MkdirAll(config.StagingDir, 0755); err != nil {
		return "", err
	}

	file, err := json.MarshalIndent(plan, "", "  ")
	if err != nil {
		return "", err
	}

	if err := os.WriteFile(fullPath, file, 0644); err != nil {
		return "", err
	}

	return fullPath, nil
}

// Aggiungi questa funzione nel tuo file Go
func getActualLiveFs(workPath string) string {
	// Se finisce per /liveroot, è già corretto, altrimenti lo aggiungiamo
	if strings.HasSuffix(workPath, "/liveroot") {
		return workPath
	}
	return filepath.Join(workPath, "liveroot")
}
