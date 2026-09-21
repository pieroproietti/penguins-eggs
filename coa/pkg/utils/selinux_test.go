package utils

import "testing"

func TestIsSELinuxEnforcing(t *testing.T) {
	// Verify that IsSELinuxEnforcing runs without panic.
	_ = IsSELinuxEnforcing()
}
