package utils

import (
	"os"
	"strings"
)

// IsSELinuxEnforcing returns true if SELinux is currently in enforcing mode.
func IsSELinuxEnforcing() bool {
	data, err := os.ReadFile("/sys/fs/selinux/enforce")
	if err != nil {
		return false
	}
	return strings.TrimSpace(string(data)) == "1"
}
