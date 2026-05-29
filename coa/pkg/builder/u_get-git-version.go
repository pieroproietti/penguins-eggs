package builder

import (
	"fmt"
	"os/exec"
	"strconv"
	"strings"
)

func getGitVersion() (string, string) {
	out, err := exec.Command("git", "describe", "--tags", "--always", "--abbrev=0").Output()
	//out, err := exec.Command("git", "describe", "--tags", "--always", "--dirty").Output()
	versionStr := "0.0.0-1"
	if err == nil {
		versionStr = strings.TrimSpace(string(out))
	}

	// 1. Togliamo la 'v' iniziale
	cleanV := strings.TrimPrefix(versionStr, "v")

	// Esempio: 0.8.0-29-g306ae66
	// Split: [0.8.0, 29, g306ae66]
	parts := strings.Split(cleanV, "-")

	baseVer := parts[0]
	relNum := "1"

	// 2. Logica di estrazione:
	// Se abbiamo più di una parte, la seconda parte è solitamente il conteggio dei commit
	if len(parts) > 1 {
		if _, err := strconv.Atoi(parts[1]); err == nil {
			relNum = parts[1]
		}
	}

	// 3. Gestione del suffisso (es. g306ae66 o dirty) per renderlo compatibile con Debian
	// Debian accetta solo cifre e lettere, il '+' è il separatore standard per build metadata
	if len(parts) > 2 {
		suffix := strings.Join(parts[2:], ".")
		baseVer = fmt.Sprintf("%s+%s", baseVer, suffix)
	}

	// 4. PULIZIA UNIVERSALE
	baseVer = strings.ReplaceAll(baseVer, "-", ".")
	baseVer = strings.ReplaceAll(baseVer, "_", ".")

	// 5. Fix storico Debian: se la versione non inizia con un numero
	if len(baseVer) > 0 && !strings.ContainsAny(string(baseVer[0]), "0123456789") {
		baseVer = "0." + baseVer
	}

	return baseVer, relNum
}
