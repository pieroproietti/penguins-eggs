package planner

import (
	"coa/pkg/utils"
	"os/exec"
	"strings"
)

func hashPassword(password string) string {
	if password == "" {
		return "$6$oa-tools$uTKAYeAVn.Y.Dy2To6HXsHt1Gt4HpMghmOV93a46jFY7hkAQ3tk7eRTKjcvSYDf5sOf3qnKzyyPYXurKp9ST3."
	}

	if strings.HasPrefix(password, "$") {
		return password
	}

	cmd := exec.Command("openssl", "passwd", "-6", password)
	out, err := cmd.Output()
	if err != nil {
		utils.LogNormal("\n[ENGINE WARNING] Unable to hash password with openssl: %v", err)
		return "$6$oa-tools$uTKAYeAVn.Y.Dy2To6HXsHt1Gt4HpMghmOV93a46jFY7hkAQ3tk7eRTKjcvSYDf5sOf3qnKzyyPYXurKp9ST3."
	}

	return strings.TrimSpace(string(out))
}
