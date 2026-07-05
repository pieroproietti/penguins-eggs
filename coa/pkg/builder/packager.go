package builder

import (
	sysctx "coa/pkg/context"
	"coa/pkg/utils"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

func packager(ctx sysctx.RuntimeContext, dist string, data RecipeData) {
	utils.LogNormal("[build] Packager: building package for %s...", dist)

	stage := ctx.StageDir
	var cmd *exec.Cmd
	var pkgFileName string

	switch dist {
	case "alpine":
		pkgFileName = fmt.Sprintf("penguins-eggs-%s-r%s.apk", data.BaseVersion, data.Rel)

		apkOutDir := filepath.Join(stage, "APK")
		os.MkdirAll(apkOutDir, 0755)

		cmd = exec.Command("abuild", "-fr")
		cmd.Dir = stage

		cmd.Env = append(os.Environ(), fmt.Sprintf("REPODEST=%s", apkOutDir))

	case "arch", "manjaro":
		pkgFileName = fmt.Sprintf("penguins-eggs-%s-%s-x86_64.pkg.tar.zst", data.BaseVersion, data.Rel)
		cmd = exec.Command("makepkg", "-s", "-f", "--noconfirm")
		cmd.Dir = stage

	case "debian":
		pkgFileName = fmt.Sprintf("penguins-eggs_%s-%s_%s.deb", data.BaseVersion, data.Rel, getDebianArch())
		finalPath := filepath.Join(ctx.ProjRoot, pkgFileName)
		cmd = exec.Command("dpkg-deb", "--root-owner-group", "--build", stage, finalPath)

	case "fedora", "opensuse":
		pkgFileName = fmt.Sprintf("penguins-eggs-%s-%s.x86_64.rpm", data.BaseVersion, data.Rel)
		rpmOutDir := filepath.Join(stage, "RPMS")
		os.MkdirAll(rpmOutDir, 0755)

		specFile := filepath.Join(stage, "penguins-eggs.spec")

		cmd = exec.Command("rpmbuild", "-bb",
			"--define", fmt.Sprintf("_stagedir %s", stage),
			"--define", fmt.Sprintf("_rpmdir %s", rpmOutDir),
			specFile,
		)

	default:
		utils.LogWarning("Distro %s not yet implemented in packager", dist)
		return
	}

	utils.LogNormal("[build] Running command: %s", cmd.String())
	cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr
	if err := cmd.Run(); err != nil {
		utils.LogError("Packager failure: %v", err)
		return
	}

	finalDest := filepath.Join(ctx.ProjRoot, pkgFileName)

	if dist != "debian" {
		var generatedPkg string

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

		if generatedPkg != "" {
			err := moveFile(generatedPkg, finalDest)
			if err != nil {
				utils.LogError("Error moving package: %v", err)
				return
			}
		} else {
			utils.LogError("Critical error: packager finished without errors, but package not found in stage!")
			return
		}
	}

	utils.LogSuccess("Package %s: %s, created in: %s", dist, pkgFileName, ctx.ProjRoot)
}

// Aggiungi questa piccola funzione helper nel file (se non c'è già)
func getDebianArch() string {
	arch := runtime.GOARCH
	if arch == "386" {
		return "i386" // Unica eccezione di nomenclatura tra Go e Debian
	}
	// amd64, arm64 e riscv64 coincidono perfettamente!
	return arch
}
