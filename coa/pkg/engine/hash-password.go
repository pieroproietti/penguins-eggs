package engine

import (
	"coa/pkg/utils"
	"os/exec"
	"strings"
)

// hashPassword verifica se la password è in chiaro e, in tal caso, genera l'hash SHA-512.
func hashPassword(password string) string {
	// Se vuota, restituiamo l'hash di "eggs"
	if password == "" {
		return "$6$oa-tools$uTKAYeAVn.Y.Dy2To6HXsHt1Gt4HpMghmOV93a46jFY7hkAQ3tk7eRTKjcvSYDf5sOf3qnKzyyPYXurKp9ST3."
	}

	// Se inizia già per "$" (es. $6$...), assumiamo sia già un hash di Linux e non la tocchiamo
	if strings.HasPrefix(password, "$") {
		return password
	}

	// È in chiaro: usiamo openssl per generare l'hash compatibile con /etc/shadow
	cmd := exec.Command("openssl", "passwd", "-6", password)
	out, err := cmd.Output()
	if err != nil {
		utils.LogNormal("\n[ENGINE WARNING] Impossibile hasare la password con openssl: %v", err)
		// Fallback di sicurezza: hash di "eggs"
		return "$6$oa-tools$uTKAYeAVn.Y.Dy2To6HXsHt1Gt4HpMghmOV93a46jFY7hkAQ3tk7eRTKjcvSYDf5sOf3qnKzyyPYXurKp9ST3."
	}

	return strings.TrimSpace(string(out))
}
