package builder

import (
	"os/exec"
	"strings"
)

func getGitVersion() (string, string) {
	// 1. Get the nearest tag (baseVer). No --always here: dpkg and abuild
	// both reject a version that doesn't start with a digit, and a raw
	// commit SHA (e.g. "c9461b1b...") fails that check on both.
	outTag, err := exec.Command("git", "describe", "--tags", "--abbrev=0").Output()
	baseVer := strings.TrimPrefix(strings.TrimSpace(string(outTag)), "v")

	if err != nil || baseVer == "" {
		// No tags in the repo: fall back to a digit-leading, monotonically
		// increasing version instead of the commit SHA.
		relNum := "1"
		if outCount, err := exec.Command("git", "rev-list", "--count", "HEAD").Output(); err == nil {
			if n := strings.TrimSpace(string(outCount)); n != "" {
				relNum = n
			}
		}
		return "0.0.0", relNum
	}

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
