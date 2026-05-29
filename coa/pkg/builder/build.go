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

	dist := strings.ToLower(d.DistroLike)

	data := RecipeData{
		BaseVersion: baseVer,
		Rel:         relNum,
		Date:        getPackageDate(),
	}

	fmt.Println(data)

	// 2. Facchino
	stage := prepare(ctx, dist)

	// 3. Sarto (ora passa 'data' invece di due stringhe separate)
	addBuildRecipe(ctx, stage, dist, data)

	// 4. Montatore
	var finalPath string
	switch dist {
	case "archlinux", "manjaro":
		// Arch non usa un percorso finale pre-definito allo stesso modo
		finalPath = stage
	case "fedora", "rhel", "centos", "rocky", "almalinux":
		finalPath = stage
	case "alpine":
		finalPath = stage
	default:
		pkgFileName := fmt.Sprintf("oa-tools_%s-%s_amd64.deb", data.BaseVersion, data.Rel)
		finalPath = filepath.Join(ctx.ProjRoot, pkgFileName)
	}
	runPackager(ctx, stage, dist, finalPath)

}
