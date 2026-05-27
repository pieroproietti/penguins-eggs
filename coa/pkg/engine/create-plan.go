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
	profile *pilot.Profile, // <-- FIRMA AGGIORNATA
	familyID string,
	isGitHubAction bool,
	isRemaster bool,
	workPath string,
	finalIsoPath string,
	stopAfter string) (string, error) {

	var plan OAPlan

	plan.IsGitHubAction = isGitHubAction
	plan.Settings = profile.Settings.Remaster

	// --- CHECK DI COLLEGAMENTO ---
	fmt.Printf("\n\033[1;35m[ENGINE DEBUG]\033[0m Verifica integrità Settings:\n")
	fmt.Printf("  -> User:        %s\n", plan.Settings.User)
	fmt.Printf("  -> Password:    %s\n", plan.Settings.Password)
	fmt.Printf("  -> Algoritmo:   %s\n", plan.Settings.Compression.Algorithm)
	fmt.Printf("  -> Livello:     %d\n", plan.Settings.Compression.Level)
	fmt.Printf("--------------------------------------------\n")

	/* Teniamo l'utente di default come "salvagente"
	defaultUser := pilot.User{
		Login:    "live",
		Password: "$6$oa-tools$uTKAYeAVn.Y.Dy2To6HXsHt1Gt4HpMghmOV93a46jFY7hkAQ3tk7eRTKjcvSYDf5sOf3qnKzyyPYXurKp9ST3.",
		Home:     "/home/live",
		Shell:    "/bin/bash",
		UID:      1000,
		GID:      1000,
	}
	*/

	var hitBreakpoint bool

	// Ora iteriamo su profile.Remaster
	for _, step := range profile.Remaster {

		if hitBreakpoint && step.Name != "coa-cleanup" {
			continue
		}

		// --- IL PONTE: Sostituzione dinamica del percorso ISO ---
		currentRunCommand := strings.TrimSpace(step.RunCommand)
		if strings.Contains(currentRunCommand, "${ISO_OUTPUT}") {
			currentRunCommand = strings.ReplaceAll(currentRunCommand, "${ISO_OUTPUT}", finalIsoPath)
		}

		// --- DESCRIZIONE DINAMICA ---
		currentDescription := step.Description
		if strings.Contains(currentDescription, "${ISO_NAME}") {
			currentDescription = strings.ReplaceAll(currentDescription, "${ISO_NAME}", filepath.Base(finalIsoPath))
		}

		switch step.Action {
		case "oa_mount_logic":
			plan.Plan = append(plan.Plan, expandMountLogic(workPath, isGitHubAction)...)

		case "oa_users":
			// 1. Utente dinamico (fallback su "live")
			targetUser := plan.Settings.User
			if targetUser == "" {
				targetUser = "live"
			}

			// 2. Hashiamo la password in Go! (Gestisce stringhe in chiaro, vuote o già hashate)
			targetPassword := hashPassword(plan.Settings.Password)

			// 3. Creiamo i percorsi dinamici per la home directory
			homeDir := fmt.Sprintf("/home/%s", targetUser)
			skelCmd := fmt.Sprintf("mkdir -p %s/liveroot%s && cp -a %s/liveroot/etc/skel/. %s/liveroot%s/", workPath, homeDir, workPath, workPath, homeDir)

			plan.Plan = append(plan.Plan, OATask{
				Step: pilot.Step{
					Action:      "oa_shell",
					Description: fmt.Sprintf("Creazione home directory per l'utente %s", targetUser),
					RunCommand:  skelCmd,
				},
			})

			usersToInject := step.Users
			if len(usersToInject) == 0 {
				// Iniettiamo l'utente on-the-fly con la password appena hashata
				usersToInject = []pilot.User{
					{
						Login:    targetUser,
						Password: targetPassword,
						Home:     homeDir,
						Shell:    "/bin/bash",
						UID:      1000,
						GID:      1000,
					},
				}
			}

			mirroredGroups := utils.GetUserGroups()
			for i := range usersToInject {
				usersToInject[i].Groups = mirroredGroups
			}

			plan.Plan = append(plan.Plan, OATask{
				Step: pilot.Step{
					Action:      "oa_users",
					Description: fmt.Sprintf("Iniezione identità utente live (%s)", targetUser),
					Users:       usersToInject,
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
			task := OATask{
				Step:       step,
				PathLiveFs: workPath,
			}
			task.Description = currentDescription
			task.RunCommand = currentRunCommand
			plan.Plan = append(plan.Plan, task)
		}

		if stopAfter != "" && step.Name == stopAfter {
			fmt.Printf("\n\033[1;33m[ENGINE] 🛑 Breakpoint '%s' elaborato.\033[0m\n", step.Name)
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
