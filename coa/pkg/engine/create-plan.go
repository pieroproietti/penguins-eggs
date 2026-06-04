package engine

import (
	"encoding/json"
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
	stopAfter string) (string, error) {

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
