package engine

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"coa/pkg/pilot"
	"coa/pkg/utils"
)

// GeneratePlan converte lo YAML in JSON.
func GeneratePlan(
	profile *pilot.Profile,
	familyID string,
	isGitHubAction bool,
	isRemaster bool,
	workPath string,
	finalIsoPath string,
	stopAfter string,
	isDebug bool) (string, error) { // <--- Nuovo parametro

	var plan OAPlan

	plan.IsGitHubAction = isGitHubAction
	plan.Settings = profile.Settings.Remaster

	var hitBreakpoint bool

	// Ora iteriamo su profile.Remaster
	for _, step := range profile.Remaster {

		if hitBreakpoint && step.Name != "coa-cleanup" {
			continue
		}

		currentRunCommand := strings.TrimSpace(step.RunCommand)
		if strings.Contains(currentRunCommand, "${ISO_OUTPUT}") {
			currentRunCommand = strings.ReplaceAll(currentRunCommand, "${ISO_OUTPUT}", finalIsoPath)
		}

		currentDescription := step.Description
		if strings.Contains(currentDescription, "${ISO_NAME}") {
			currentDescription = strings.ReplaceAll(currentDescription, "${ISO_NAME}", filepath.Base(finalIsoPath))
		}

		switch step.Action {
		case "oa_mount_logic":
			plan.Plan = append(plan.Plan, expandMountLogic(workPath, isGitHubAction)...)

		case "oa_users":
			plan.Plan = append(plan.Plan, oaUsers(plan.Settings, step, workPath)...)

		case "oa_umount":
			plan.Plan = append(plan.Plan, OATask{
				Step: pilot.Step{
					Action:      "oa_umount",
					Description: "Pulizia finale dei mount",
				},
				PathLiveFs: workPath,
			})

		case "oa-ell":
			task := OATask{
				Step:       step,
				PathLiveFs: workPath,
			}
			task.Description = currentDescription
			task.RunCommand = currentRunCommand

			// 1. Controlliamo se ci sono effettivamente dei parametri passati dal profile
			if len(step.Params) > 0 {

				// 2. Estraiamo un parametro specifico in modo sicuro
				// L'idioma "comma ok" ci protegge dai crash se la chiave non esiste
				if val, exists := step.Params["script_path"]; exists {

					// 3. Facciamo il casting (type assertion) al tipo che ci aspettiamo
					if scriptPath, isString := val.(string); isString {
						// Ora sappiamo per certo che scriptPath è una stringa valida
						// Possiamo iniettarlo nel comando o manipolare il task
						task.RunCommand = fmt.Sprintf("%s %s", currentRunCommand, scriptPath)
						utils.LogNormal("\n[ENGINE] Parametro 'script_path' iniettato in oa-ell: %s", scriptPath)
					} else {
						utils.LogWarning("\n[ENGINE] Il parametro 'script_path' non è una stringa valida!")
					}
				}

				// Puoi fare lo stesso per parametri booleani, interi, ecc.
				if val, exists := step.Params["force_execution"]; exists {
					if force, isBool := val.(bool); isBool && force {
						utils.LogNormal("\n[ENGINE] Esecuzione forzata abilitata per oa-ell")
					}
				}
			}

			// Infine, accodiamo il task "arricchito" al piano
			plan.Plan = append(plan.Plan, task)

		default:
			task := OATask{
				Step:       step,
				PathLiveFs: workPath,
			}
			task.Description = currentDescription
			task.RunCommand = currentRunCommand

			// Prima di "coa-xorriso" inseriamo "coa-dot-disk"
			if task.Name == "coa-xorriso" {
				isoFilename := filepath.Base(finalIsoPath)
				isoWorkDir := filepath.Join(workPath, "isodir")

				dotDiskScript := createDotDiskScript(isoWorkDir, isoFilename, "", "")

				// 1. Accodiamo lo script per creare la cartella .disk AL PIANO
				plan.Plan = append(plan.Plan, OATask{
					Step: pilot.Step{
						Action:      "oa_shell",
						Name:        "coa-dot-disk",
						Description: "Creazione metadati .disk (Standard Debian per live-boot)",
						RunCommand:  dotDiskScript,
					},
					PathLiveFs: workPath,
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
	// ... (la funzione savePlan rimane identica a prima)
	targetDir := "/tmp/coa"
	targetFile := "oa-plan.json"
	fullPath := filepath.Join(targetDir, targetFile)

	if err := os.MkdirAll(targetDir, 0755); err != nil {
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
