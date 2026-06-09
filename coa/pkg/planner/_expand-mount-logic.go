package planner

import (
	"coa/pkg/parser"
	"fmt"
	"os"
	"path/filepath"
)

// expandMountLogic trasforma la vecchia logica statica del C in una sequenza di task JSON dinamici.
func expandMountLogic(basePath string, isGitHubAction bool) []OATask {
	var tasks []OATask
	liveroot := filepath.Join(basePath, "liveroot")
	overlay := filepath.Join(basePath, ".overlay")

	// 1. SETUP STRUTTURA: Creiamo le cartelle di base per l'ambiente di rimasterizzazione
	baseDirs := []string{
		liveroot,
		overlay,
		filepath.Join(overlay, "upperdir"),
		filepath.Join(overlay, "workdir"),
		filepath.Join(overlay, "lowerdir"),
	}
	for _, d := range baseDirs {
		tasks = append(tasks, OATask{
			Step: parser.Step{Action: "oa_mkdir", Path: d, Description: "Setup base path"},
		})
	}

	// 2. COPIE FISICHE: Necessarie per rendere il chroot funzionale e bootabile
	tasks = append(tasks, OATask{Step: parser.Step{Action: "oa_cp", Src: "/etc", Dst: liveroot, Description: "Copia fisica /etc"}})
	tasks = append(tasks, OATask{Step: parser.Step{Action: "oa_cp", Src: "/boot", Dst: liveroot, Description: "Copia fisica /boot"}})

	// Copia dei symlink del kernel
	for _, link := range []string{"vmlinuz", "initrd.img", "vmlinuz.old", "initrd.img.old"} {
		src := "/" + link
		if _, err := os.Lstat(src); err == nil {
			tasks = append(tasks, OATask{
				Step: parser.Step{
					Action:      "oa_cp",
					Src:         src,
					Dst:         filepath.Join(liveroot, link),
					Description: "Copia symlink: " + link,
				},
			})
		}
	}

	// 3. BIND MOUNTS DINAMICI (CON FIX USRMERGE)
	entries := []string{"bin", "sbin", "lib", "lib64", "opt", "root", "srv"}
	for _, e := range entries {
		src := "/" + e
		if info, err := os.Lstat(src); err == nil {
			if info.Mode()&os.ModeSymlink != 0 {
				// È un symlink (Usrmerge attivo)
				target, err := os.Readlink(src)
				if err == nil {
					cmd := fmt.Sprintf("ln -sf %s %s", target, filepath.Join(liveroot, e))
					tasks = append(tasks, OATask{
						Step: parser.Step{
							Action:      "oa_shell",
							Description: "Replica Usrmerge symlink: " + e,
							RunCommand:  cmd,
						},
					})
				}
			} else {
				// Cartella reale, bind mount classico
				tasks = append(tasks, OATask{
					Step: parser.Step{
						Action:      "oa_bind",
						Src:         src,
						Dst:         filepath.Join(liveroot, e),
						Description: "Bind mount proiettivo: " + e,
					},
					ReadOnly: true, // Campo tecnico di OATask
				})
			}
		}
	}

	// 4. OVERLAY PER USR E VAR
	for _, ovlDir := range []string{"usr", "var"} {
		lower := filepath.Join(overlay, "lowerdir", ovlDir)
		upper := filepath.Join(overlay, "upperdir", ovlDir)
		work := filepath.Join(overlay, "workdir", ovlDir)
		merged := filepath.Join(liveroot, ovlDir)

		// Creiamo i rami dell'overlay
		tasks = append(tasks, OATask{Step: parser.Step{Action: "oa_mkdir", Path: lower}})
		tasks = append(tasks, OATask{Step: parser.Step{Action: "oa_mkdir", Path: upper}})
		tasks = append(tasks, OATask{Step: parser.Step{Action: "oa_mkdir", Path: work}})

		// Bind della directory originale su lower (ReadOnly)
		tasks = append(tasks, OATask{
			Step:     parser.Step{Action: "oa_bind", Src: "/" + ovlDir, Dst: lower},
			ReadOnly: true, // Campo tecnico di OATask
		})

		// Mount Overlay finale
		opts := "lowerdir=" + lower + ",upperdir=" + upper + ",workdir=" + work
		tasks = append(tasks, OATask{
			Step: parser.Step{
				Action:      "oa_mount_generic",
				Src:         "overlay",
				Dst:         merged,
				Description: "Overlay mount per scrivibilità: " + ovlDir,
			},
			Type: "overlay", // Campo tecnico
			Opts: opts,      // Campo tecnico
		})
	}

	// 5. API FILESYSTEMS
	tasks = append(tasks, OATask{
		Step: parser.Step{Action: "oa_mount_generic", Src: "proc", Dst: filepath.Join(liveroot, "proc")},
		Type: "proc",
	})
	tasks = append(tasks, OATask{
		Step: parser.Step{Action: "oa_mount_generic", Src: "sys", Dst: filepath.Join(liveroot, "sys")},
		Type: "sysfs",
	})
	tasks = append(tasks, OATask{Step: parser.Step{Action: "oa_bind", Src: "/dev", Dst: filepath.Join(liveroot, "dev"), Description: "API FS: dev"}})
	tasks = append(tasks, OATask{Step: parser.Step{Action: "oa_bind", Src: "/run", Dst: filepath.Join(liveroot, "run"), Description: "API FS: run"}})

	// 6. tmpfs
	tmpPath := filepath.Join(liveroot, "tmp")
	runCmd := "mkdir -p " + tmpPath + " && chmod 1777 " + tmpPath

	if !isGitHubAction {
		runCmd += " && mount -t tmpfs -o mode=1777 tmpfs " + tmpPath
	}

	tasks = append(tasks, OATask{
		Step: parser.Step{
			Action:      "oa_shell",
			Description: "API FS: tmp (Sticky Bit + Tmpfs)",
			RunCommand:  runCmd,
		},
	})

	return tasks
}
