package planner

import (
	"coa/pkg/utils"
	"strings"

	"github.com/tredoe/osutil/user/crypt/sha512_crypt"
)

func hashPassword(password string) string {
	if password == "" {
		return "$6$oa-tools$uTKAYeAVn.Y.Dy2To6HXsHt1Gt4HpMghmOV93a46jFY7hkAQ3tk7eRTKjcvSYDf5sOf3qnKzyyPYXurKp9ST3."
	}

	if strings.HasPrefix(password, "$") {
		return password
	}

	c := sha512_crypt.New()
	hash, err := c.Generate([]byte(password), []byte{})
	if err != nil {
		utils.LogNormal("\n[ENGINE WARNING] Unable to hash password with sha512_crypt: %v", err)
		return "$6$oa-tools$uTKAYeAVn.Y.Dy2To6HXsHt1Gt4HpMghmOV93a46jFY7hkAQ3tk7eRTKjcvSYDf5sOf3qnKzyyPYXurKp9ST3."
	}

	return string(hash)
}
