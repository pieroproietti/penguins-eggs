/*
 * penguins-eggs - Copyright (C) 2017-2026 Piero Proietti
 * Author: Piero Proietti <piero.proietti@gmail.com>
 * https://penguins-eggs.net
 *
 * This file is part of penguins-eggs.
 * Released under the GNU GPL v3 license.
 */

package utils

import "testing"

func TestIsSELinuxEnforcing(t *testing.T) {
	// Verify that IsSELinuxEnforcing runs without panic.
	_ = IsSELinuxEnforcing()
}
