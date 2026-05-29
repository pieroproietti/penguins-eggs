package builder

import (
	"os/exec"
	"strings"
)

func getGitVersion() (string, string) {
	// 1. Prendi il tag più vicino (baseVer)
	outTag, _ := exec.Command("git", "describe", "--tags", "--always", "--abbrev=0").Output()
	baseVer := strings.TrimPrefix(strings.TrimSpace(string(outTag)), "v")

	// 2. Conta i commit dal tag (relNum)
	// Se sei sul tag, questo restituisce "0". Se sei avanti di 29 commit, restituisce "29"
	outRel, err := exec.Command("git", "rev-list", "--count", "HEAD", "--not", "--tags").Output()
	relNum := "1" // Fallback
	if err == nil {
		relNum = strings.TrimSpace(string(outRel))
		if relNum == "0" {
			relNum = "1" // Se sei sul tag, la release è 1
		}
	}

	// 3. PULIZIA (per sicurezza, anche se i tag solitamente sono puliti)
	baseVer = strings.ReplaceAll(baseVer, "-", ".")
	baseVer = strings.ReplaceAll(baseVer, "_", ".")

	return baseVer, relNum
}
