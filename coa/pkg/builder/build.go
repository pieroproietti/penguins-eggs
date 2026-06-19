package builder

import (
	"coa/pkg/distro"
	"coa/pkg/utils"
	"fmt"
	"strings"
	"time"

	sysctx "coa/pkg/context"
)

func LogBuild(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	utils.LogNormal("[build] %s", msg)
}

func LogError(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	utils.LogNormal("%s", msg)
}

func HandleBuild(d *distro.Distro) {

	// 1. Data preparation
	ctx := sysctx.Detect()
	baseVer, relNum := getGitVersion()
	dist := strings.ToLower(d.DistroLike)
	now := time.Now()
	data := RecipeData{
		BaseVersion: baseVer,
		Rel:         relNum,
		Date:        now.Format(time.RFC1123Z),
		RpmDate:     now.Format("Mon Jan 02 2006"),
	}

	// 2. staging
	staging(ctx)

	// 3. addBuildRecipe
	recipe(ctx, dist, data)

	// 4. Packager
	packager(ctx, dist, data)
}
