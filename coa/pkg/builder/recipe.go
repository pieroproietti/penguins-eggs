package builder

import (
	sysctx "coa/pkg/context"
	"coa/pkg/utils"
	"fmt"
	"os"
	"path/filepath"
)

// recipe writes the control file (PKGBUILD, SPEC, etc.) into the staging area
func recipe(ctx sysctx.RuntimeContext, dist string, data RecipeData) {
	utils.LogNormal("[build] Recipe: writing recipe for %s...", dist)

	stage := ctx.StageDir

	switch dist {
	case "alpine":
		writeAPKBUILD(ctx, stage, data)

	case "arch", "manjaro":
		writePKGBUILD(ctx, stage, dist, data)

	case "fedora", "opensuse":
		writeSpecFile(ctx, stage, dist, data)

	default:
		writeDebianFiles(ctx, stage, data)
	}
}

// writeAPKBUILD writes the APKBUILD for alpine
func writeAPKBUILD(ctx sysctx.RuntimeContext, stage string, data RecipeData) error {
	// 1. Define the template path and name
	tmplPath := filepath.Join(ctx.ProjRoot, "coa/pkg/builder/templates/alpine.tmpl")

	// 2. Destination: in the stage root, must be named "APKBUILD"
	destPath := filepath.Join(stage, "APKBUILD")

	// 3. Merge the data
	return writeTemplate(tmplPath, destPath, data)
}

// writePKGBUILD writes the PKGBUILD for arch/manjaro
func writePKGBUILD(ctx sysctx.RuntimeContext, stage string, dist string, data RecipeData) error {
	// 1. Build the template filename (arch/manjaro) and source path
	tmplName := fmt.Sprintf("%s.tmpl", dist)
	tmplPath := filepath.Join(ctx.ProjRoot, "coa/pkg/builder/templates", tmplName)

	// 2. Destination: in the stage root, must be named exactly "PKGBUILD"
	destPath := filepath.Join(stage, "PKGBUILD")

	// 3. Merge the data
	return writeTemplate(tmplPath, destPath, data)
}

// writeSpecFile writes oa-tools.spec for fedora/opensuse
func writeSpecFile(ctx sysctx.RuntimeContext, stage string, dist string, data RecipeData) error {
	// 1. Define the template name (fedora/opensuse)
	tmplName := fmt.Sprintf("%s.tmpl", dist)
	tmplPath := filepath.Join(ctx.ProjRoot, "coa/pkg/builder/templates", tmplName)

	// The RPM destination file is conventionally named after the package
	destPath := filepath.Join(stage, "oa-tools.spec")

	// 2. Merge using the helper function
	return writeTemplate(tmplPath, destPath, data)
}

// writeDebianFiles sets up the DEBIAN directory and creates control, rules, compat, copyright
func writeDebianFiles(ctx sysctx.RuntimeContext, stage string, data RecipeData) error {
	debianDir := filepath.Join(stage, "DEBIAN")

	// Ensure the directory exists
	os.MkdirAll(debianDir, 0755)

	// Template -> destination map
	files := map[string]string{
		"control.tmpl":   "control",
		"rules.tmpl":     "rules",
		"compat.tmpl":    "compat",
		"copyright.tmpl": "copyright",
		"changelog.tmpl": "changelog",
	}

	for tmplName, destName := range files {
		tmplPath := filepath.Join(ctx.ProjRoot, "coa/pkg/builder/templates/debian", tmplName)
		destPath := filepath.Join(debianDir, destName)

		// Visual feedback for the maintainer
		utils.LogNormal("--> Writing template: %s -> %s", tmplName, destPath)

		// Use 'data' directly, which contains BaseVersion, Rel, and Date
		err := writeTemplate(tmplPath, destPath, data)
		if err != nil {
			return err
		}
	}
	return nil
}
