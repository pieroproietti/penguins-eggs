package planner

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"coa/pkg/parser"
	"coa/pkg/pathDefaults"
	"coa/pkg/utils"
)

func GeneratePlan(
	profile *parser.Profile,
	familyID string,
	isGitHubAction bool,
	isRemaster bool,
	workPath string,
	finalIsoPath string,
	stopAfter string,
	isDebug bool,
	mode string,
	luksPassphrase string,
	fdtDir string,
	fdtFile string) (string, []byte, error) {

	var plan OAPlan

	plan.IsGitHubAction = isGitHubAction
	plan.Settings = profile.Settings.Remaster

	var hitBreakpoint bool

	for _, step := range profile.Remaster {

		if hitBreakpoint && step.Name != "cleanup" {
			continue
		}

		currentRunCommand := strings.TrimSpace(step.RunCommand)

		currentDescription := step.Description
		if strings.Contains(currentDescription, "${ISO_NAME}") {
			currentDescription = strings.ReplaceAll(currentDescription, "${ISO_NAME}", filepath.Base(finalIsoPath))
		}

		switch step.Module {
		case "mount_logic":
			plan.Plan = append(plan.Plan, mountLogic(workPath, isGitHubAction, mode)...)

		case "users":
			if mode == "clone" || mode == "crypted" {
				utils.LogNormal("[ENGINE] Mode '%s': real users cloned from /home, skipping 'users' module.", mode)
			} else {
				plan.Plan = append(plan.Plan, buildLiveUserTasks(plan.Settings, step, workPath)...)
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
			plan.Plan = append(plan.Plan, task)

		default:
			if mode == "crypted" && step.Module == "autologin-gui" {
				utils.LogNormal("[ENGINE] Crypted mode: skipping autologin-gui.")
				continue
			}

			task := OATask{
				Step:     step,
				LiveRoot: getActualLiveFs(workPath),
			}
			task.Description = currentDescription
			task.RunCommand = currentRunCommand

			if task.Module == "autologin-gui" {
				if task.Params == nil {
					task.Params = make(map[string]interface{})
				}
				liveUser := profile.Settings.Remaster.User
				if liveUser == "" {
					liveUser = "live"
				}
				task.Params["user"] = liveUser
				task.Params["is_gui"] = true
			}

			if task.Name == "conf-live-sudoers" {
				if task.Params == nil {
					task.Params = make(map[string]interface{})
				}
				liveUser := profile.Settings.Remaster.User
				if liveUser == "" {
					liveUser = "live"
				}
				if content, ok := task.Params["content"].(string); ok {
					task.Params["content"] = content + fmt.Sprintf("\n%s ALL=(ALL) NOPASSWD:ALL\n", liveUser)
				}
			}

			if task.Name == "mksquashfs" {
				comp := profile.Settings.Remaster.Compression
				if comp.Algorithm != "" {
					task.Params["algorithm"] = comp.Algorithm
				}
				if comp.Level > 0 {
					task.Params["level"] = fmt.Sprintf("%d", comp.Level)
				}
			}

			if mode == "crypted" && task.Name == "initramfs" {
				plan.Plan = append(plan.Plan, buildEncryptedInitramfs(workPath))
				utils.LogNormal("[ENGINE] Crypted mode: initramfs replaced with buildEncryptedInitramfs.")
				continue
			}

			if mode == "crypted" && task.Name == "copy-kernel-initrd" {
				plan.Plan = append(plan.Plan, luksKernelCopyStep(workPath))
				utils.LogNormal("[ENGINE] Crypted mode: copy-kernel-initrd replaced with luksKernelCopyStep.")
				continue
			}

			if mode == "crypted" && task.Name == "mksquashfs" {
				plan.Plan = append(plan.Plan, task)
				plan.Plan = append(plan.Plan, luksWrapStep(workPath, luksPassphrase))
				utils.LogNormal("[ENGINE] Crypted mode: luksWrapStep injected after mksquashfs.")
				continue
			}

			if mode == "crypted" && task.Name == "generate-boot-menus" {
				if args, ok := task.Params["args"].([]interface{}); ok && len(args) >= 2 {
					if bootParams, ok := args[1].(string); ok {
						args[1] = bootParams + " live-media=/dev/mapper/live-root"
					}
				}
				utils.LogNormal("[ENGINE] Crypted mode: boot params updated with live-media LUKS.")
			}

			if task.Name == "xorriso" {
				if fdtDir != "" {
					spacemitDir := "./spacemit"
					if fi, err := os.Stat(spacemitDir); err != nil || !fi.IsDir() {
						spacemitDir = "/usr/share/penguins-eggs/spacemit"
					}

					scriptContent, err := BuildMakeImgStep(workPath, finalIsoPath, fdtDir, fdtFile, spacemitDir)
					if err != nil {
						return "", nil, fmt.Errorf("failed to build make-img step: %w", err)
					}

					task = OATask{
						Step: parser.Step{
							Name:        "make-img",
							Description: "Generating Live Raw Image (RISC-V Spacemit K1) - genimage Mode",
							Module:      "shell",
							Params: map[string]interface{}{
								"command": scriptContent,
							},
						},
					}
					utils.LogNormal("\n[ENGINE] xorriso step replaced with make-img (.img) generator.")
				} else {
					task.Params["output_file"] = finalIsoPath
					task.Params["source_dir"] = filepath.Join(workPath, "isodir")

					outputFile := task.Params["output_file"].(string)
					sourceDir := task.Params["source_dir"].(string)

					scriptContent := createDotDiskScript(sourceDir, filepath.Base(outputFile), "", "")
					plan.Plan = append(plan.Plan, OATask{
						Step: parser.Step{
							Name:        "coa-dot-disk",
							Description: "Creazione metadati .disk (Standard Debian per live-boot)",
							Module:      "shell",
							Params: map[string]interface{}{
								"command": scriptContent,
							},
						},
					})
					utils.LogNormal("\n[ENGINE] .disk metadata injection completed for live-boot.")
				}
			}

			plan.Plan = append(plan.Plan, task)

		}

		if stopAfter != "" && step.Name == stopAfter {
			utils.LogNormal("\n[ENGINE] 🛑 Breakpoint '%s' processed.", step.Name)
			hitBreakpoint = true
		}
	}

	for i, task := range plan.Plan {
		if task.WorkDir != "" {
			plan.Plan[i].WorkDir = workPath
		}

		if task.LiveRoot != "" {
			plan.Plan[i].LiveRoot = fmt.Sprintf("%s/liveroot", workPath)
		}

		if task.Chroot && task.LiveRoot == "" {
			plan.Plan[i].LiveRoot = fmt.Sprintf("%s/liveroot", workPath)
		}
	}

	if isDebug {
		fmt.Println("\n====================================================================")
		fmt.Println("                     [penguins-eggs] DEBUG JSON PLAN                     ")
		fmt.Println("====================================================================")

		jsonDebug, _ := json.MarshalIndent(plan, "", "  ")
		fmt.Println(string(jsonDebug))

		fmt.Println("====================================================================")
		fmt.Println("[debug] Execution stopped by --debug flag. No ISO generated.")
		os.Exit(0)
	}

	planJSON, err := json.MarshalIndent(plan, "", "  ")
	if err != nil {
		return "", nil, err
	}

	if mode == "crypted" {
		return "", planJSON, nil
	}

	path, err := savePlan(planJSON)
	return path, nil, err
}

func savePlan(planJSON []byte) (string, error) {
	fullPath := pathDefaults.PlanFile

	if err := os.MkdirAll(pathDefaults.StagingDir, 0755); err != nil {
		return "", err
	}

	if err := os.WriteFile(fullPath, planJSON, 0644); err != nil {
		return "", err
	}

	return fullPath, nil
}

func getActualLiveFs(workPath string) string {
	if strings.HasSuffix(workPath, "/liveroot") {
		return workPath
	}
	return filepath.Join(workPath, "liveroot")
}
