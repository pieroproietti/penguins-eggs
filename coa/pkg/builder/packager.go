package builder

import (
	sysctx "coa/pkg/context"
	"coa/pkg/utils"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings" // Aggiunto per strings.HasSuffix (Alpine)
)

func packager(ctx sysctx.RuntimeContext, dist string, data RecipeData) {
	utils.LogNormal("[build] Packager: sigillo il pacchetto per %s...", dist)

	stage := ctx.StageDir
	var cmd *exec.Cmd
	var pkgFileName string

	switch dist {
	case "alpine":
		pkgFileName = fmt.Sprintf("oa-tools-%s-r%s.apk", data.BaseVersion, data.Rel)

		// 1. Creiamo una cartella isolata nello staging per l'output di Alpine
		apkOutDir := filepath.Join(stage, "APK")
		os.MkdirAll(apkOutDir, 0755)

		// 2. Prepariamo il comando isolando abuild nello staging
		cmd = exec.Command("abuild", "-fr")
		cmd.Dir = stage

		// Passiamo REPODEST per costringerlo a salvare dentro la nostra cartella APK
		cmd.Env = append(os.Environ(), fmt.Sprintf("REPODEST=%s", apkOutDir))

	case "arch", "manjaro":
		pkgFileName = fmt.Sprintf("oa-tools-%s-%s-%s-x86_64.pkg.tar.zst", dist, data.BaseVersion, data.Rel)
		cmd = exec.Command("makepkg", "-s", "-f", "--noconfirm")
		cmd.Dir = stage

	case "debian":
		pkgFileName = fmt.Sprintf("oa-tools_%s-%s_amd64.deb", data.BaseVersion, data.Rel)
		// Correzione per Debian: gli passiamo direttamente il PERCORSO COMPLETO del file finale
		finalPath := filepath.Join(ctx.ProjRoot, pkgFileName)
		cmd = exec.Command("dpkg-deb", "--root-owner-group", "--build", stage, finalPath)

	case "fedora", "opensuse":
		pkgFileName = fmt.Sprintf("oa-tools-%s-%s-%s.x86_64.rpm", dist, data.BaseVersion, data.Rel)
		// 1. Creiamo una cartella dedicata per l'output di RPM dentro lo stage
		rpmOutDir := filepath.Join(stage, "RPMS")
		os.MkdirAll(rpmOutDir, 0755)

		// 2. Il percorso del file .spec generato in precedenza dal Sarto
		specFile := filepath.Join(stage, "oa-tools.spec")

		// 3. Prepariamo il comando isolando rpmbuild nello staging
		cmd = exec.Command("rpmbuild", "-bb",
			"--define", fmt.Sprintf("_stagedir %s", stage),
			"--define", fmt.Sprintf("_rpmdir %s", rpmOutDir),
			specFile,
		)

	default:
		utils.LogWarning("Distro %s non ancora implementata nel packager", dist)
		return
	}

	// --- ESECUZIONE DEL COMANDO ---
	utils.LogNormal("[build] Esecuzione comando: %s", cmd.String())
	cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr
	if err := cmd.Run(); err != nil {
		utils.LogError("Fallimento packager: %v", err)
		return
	}

	// --- POST-ELABORAZIONE: Ricognizione e Spostamento ---
	// La destinazione finale assoluta dove vogliamo il pacchetto
	finalDest := filepath.Join(ctx.ProjRoot, pkgFileName)

	// Debian salva già il file direttamente in finalDest grazie al comando corretto,
	// quindi facciamo lo spostamento solo per le altre distribuzioni
	if dist != "debian" {
		var generatedPkg string

		// Cerchiamo il pacchetto appena creato nelle varie cartelle temporanee
		if dist == "arch" || dist == "manjaro" {
			matches, _ := filepath.Glob(filepath.Join(stage, "*.pkg.tar.zst"))
			if len(matches) > 0 {
				generatedPkg = matches[0]
			}
		} else if dist == "fedora" || dist == "opensuse" {
			matches, _ := filepath.Glob(filepath.Join(stage, "RPMS", "*", "*.rpm"))
			if len(matches) > 0 {
				generatedPkg = matches[0]
			}
		} else if dist == "alpine" {
			filepath.Walk(filepath.Join(stage, "APK"), func(path string, info os.FileInfo, e error) error {
				if e == nil && !info.IsDir() && strings.HasSuffix(info.Name(), ".apk") {
					generatedPkg = path
				}
				return nil
			})
		}

		// Se lo abbiamo trovato, lo spostiamo E lo rinominiamo col nostro pkgFileName
		if generatedPkg != "" {
			err := moveFile(generatedPkg, finalDest)
			if err != nil {
				utils.LogError("Errore durante lo spostamento del pacchetto: %v", err)
				return
			}
		} else {
			utils.LogError("Errore critico: il Montatore ha finito senza errori, ma non trovo il pacchetto nello stage!")
			return
		}
	}

	utils.LogSuccess("Pacchetto %s: %s, creato in: %s", dist, pkgFileName, ctx.ProjRoot)
}
