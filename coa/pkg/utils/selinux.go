/*
 * penguins-eggs - Copyright (C) 2017-2026 Piero Proietti
 * Author: Piero Proietti <piero.proietti@gmail.com>
 * https://penguins-eggs.net
 *
 * This file is part of penguins-eggs.
 * Released under the GNU GPL v3 license.
 */

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
