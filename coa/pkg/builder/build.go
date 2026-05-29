package builder

import (
	"coa/pkg/distro"
	"fmt"
	"path/filepath"
	"strings"

	sysctx "coa/pkg/context" // <-- Il nostro cervello universale
)

func LogBuild(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	fmt.Printf("%s[build]%s %s\n", ColorBlue, ColorReset, msg)
}

func LogError(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	fmt.Printf("%s[ERROR]%s %s\n", ColorRed, ColorReset, msg)
}

func HandleBuild(d *distro.Distro) {
	// 1. Preparazione Dati (Il "Cervello")
	ctx := sysctx.Detect()
	baseVer, relNum := getGitVersion()

	data := RecipeData{
		BaseVersion: baseVer,
		Rel:         relNum,
		Date:        getPackageDate(),
	}

	// 2. staging
	stage := staging(ctx)
	fmt.Printf("stage: %s\n\n\n\n", stage)

	// 3. addBuildRecipe
	dist := strings.ToLower(d.DistroLike)
	recipe(ctx, stage, dist, data)

	// 4. Packager
	var finalPath string
	switch dist {
	case "arch", "archlinux", "manjaro":
		err := writePKGBUILD(ctx, stage, dist, data)
		if err != nil {
			LogError("Fallimento Sarto per %s: %v", dist, err)
			return
		}
		finalPath = stage

	case "fedora", "rhel", "centos", "rocky", "almalinux":
		finalPath = ctx.StageDir
	case "alpine":
		finalPath = ctx.StageDir
	default:
		pkgFileName := fmt.Sprintf("oa-tools_%s-%s_amd64.deb", data.BaseVersion, data.Rel)
		finalPath = filepath.Join(ctx.ProjRoot, pkgFileName)
	}
	packager(stage, dist, finalPath)

}
