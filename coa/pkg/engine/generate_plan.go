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
// Nota: steps ora è di tipo []pilot.Step
func GeneratePlan(steps []pilot.Step, familyID string, isRemaster bool, workPath string, finalIsoPath string, stopAfter string) (string, error) {
	var plan OAPlan

	// Teniamo l'utente di default come "salvagente" nel caso lo YAML non specifichi utenti
	defaultUser := pilot.User{
		Login:    "live",
		Password: "$6$oa-tools$uTKAYeAVn.Y.Dy2To6HXsHt1Gt4HpMghmOV93a46jFY7hkAQ3tk7eRTKjcvSYDf5sOf3qnKzyyPYXurKp9ST3.",
		Home:     "/home/live",
		Shell:    "/bin/bash",
		UID:      1000,
		GID:      1000,
	}

	var hitBreakpoint bool

	for _, step := range steps {

		if hitBreakpoint && step.Name != "coa-cleanup" {
			continue
		}

		// --- IL PONTE: Sostituzione dinamica del percorso ISO ---
		currentRunCommand := step.RunCommand
		// Sanitize
		currentRunCommand = strings.TrimSpace(currentRunCommand)
		if strings.Contains(currentRunCommand, "${ISO_OUTPUT}") {
			currentRunCommand = strings.ReplaceAll(currentRunCommand, "${ISO_OUTPUT}", finalIsoPath)
		}

		// --- DESCRIZIONE DINAMICA ---
		currentDescription := step.Description
		if strings.Contains(currentDescription, "${ISO_NAME}") {
			currentDescription = strings.ReplaceAll(currentDescription, "${ISO_NAME}", filepath.Base(finalIsoPath))
		}

		// Usiamo Action al posto di Command!
		switch step.Action {

		case "oa_mount_logic":
			plan.Plan = append(plan.Plan, expandMountLogic(workPath)...)

		case "oa_users":
			// 1. Creazione Home directory
			plan.Plan = append(plan.Plan, OATask{
				Step: pilot.Step{
					Action:      "oa_shell",
					Description: "Creazione home directory da /etc/skel",
					RunCommand:  fmt.Sprintf("mkdir -p %s/liveroot/home/live && cp -a %s/liveroot/etc/skel/. %s/liveroot/home/live/", workPath, workPath, workPath),
				},
			})

			// 2. Logica Utenti: Prendiamo gli utenti dallo YAML
			usersToInject := step.Users

			// Se lo YAML non ha utenti definiti, usiamo il salvagente
			if len(usersToInject) == 0 {
				usersToInject = []pilot.User{defaultUser}
			}

			// Recuperiamo i gruppi host specchiati (es. docker, libvirt, wheel)
			mirroredGroups := utils.GetUserGroups()

			// Iniettiamo i gruppi specchiati negli utenti che stiamo per passare
			for i := range usersToInject {
				usersToInject[i].Groups = mirroredGroups
			}

			// 3. Invio ad oa
			plan.Plan = append(plan.Plan, OATask{
				Step: pilot.Step{
					Action:      "oa_users",
					Description: "Iniezione identità utenti live",
					Users:       usersToInject, // Passaggio DIRETTO degli utenti dallo YAML!
				},
				PathLiveFs: workPath,
			})

		case "oa_umount":
			plan.Plan = append(plan.Plan, OATask{
				Step: pilot.Step{
					Action:      "oa_umount",
					Description: "Pulizia finale dei mount",
				},
				PathLiveFs: workPath,
			})

		default:
			// --- LA MAGIA DELL'EMBEDDING ---
			// Invece di mappare 10 campi a mano, copiamo lo step intero.
			task := OATask{
				Step:       step,     // Eredita Action, Chroot, Path, Src, Dst, ecc.
				PathLiveFs: workPath, // Campo specifico dell'Engine
			}

			// Sovrascriviamo solo i campi che abbiamo "risolto" con le variabili dinamiche
			task.Description = currentDescription
			task.RunCommand = currentRunCommand

			plan.Plan = append(plan.Plan, task)
		}

		if stopAfter != "" && step.Name == stopAfter {
			fmt.Printf("\n\033[1;33m[ENGINE] 🛑 Breakpoint '%s' elaborato. Generazione JSON accorciata.\033[0m\n", step.Name)
			hitBreakpoint = true
		}
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
