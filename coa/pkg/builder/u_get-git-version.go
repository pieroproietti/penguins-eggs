package builder

import (
	"os/exec"
	"strings"
)

func getGitVersion() (string, string) {
	// 1. Get the nearest tag (baseVer)
	outTag, _ := exec.Command("git", "describe", "--tags", "--always", "--abbrev=0").Output()
	baseVer := strings.TrimPrefix(strings.TrimSpace(string(outTag)), "v")

	// 2. Count commits since the tag (relNum)
	// If on the tag, this returns "0". If 29 commits ahead, returns "29"
	outRel, err := exec.Command("git", "rev-list", "--count", "HEAD", "--not", "--tags").Output()
	relNum := "1" // Fallback
	if err == nil {
		relNum = strings.TrimSpace(string(outRel))
		if relNum == "0" {
			relNum = "1" // If on the tag, release is 1
		}
	}

	// 3. Sanitize (just in case, even though tags are usually clean)
	baseVer = strings.ReplaceAll(baseVer, "-", ".")
	baseVer = strings.ReplaceAll(baseVer, "_", ".")

	return baseVer, relNum
}
