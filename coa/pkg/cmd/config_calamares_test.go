package cmd

import (
	"reflect"
	"testing"
)

// The package index must be refreshed before installing calamares, otherwise
// the install fails when the local apt lists are stale.
func TestCalamaresInstallCmdsUpdateBeforeInstall(t *testing.T) {
	want := [][]string{
		{"apt-get", "update"},
		{"apt-get", "install", "-y", "calamares"},
	}
	if got := calamaresInstallCmds(); !reflect.DeepEqual(got, want) {
		t.Fatalf("calamaresInstallCmds() = %v, want %v", got, want)
	}
}
