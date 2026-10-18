package cmd

import (
	"os"
	"testing"
)

func TestIsCalamaresAvailable(t *testing.T) {
	origDisplay := os.Getenv("DISPLAY")
	origWayland := os.Getenv("WAYLAND_DISPLAY")
	defer func() {
		os.Setenv("DISPLAY", origDisplay)
		os.Setenv("WAYLAND_DISPLAY", origWayland)
	}()

	// Without display environment, should return false
	os.Unsetenv("DISPLAY")
	os.Unsetenv("WAYLAND_DISPLAY")
	if isCalamaresAvailable() {
		t.Errorf("isCalamaresAvailable() returned true when DISPLAY and WAYLAND_DISPLAY are unset")
	}
}

func TestSysinstallSubcommands(t *testing.T) {
	hasCalamares := false
	hasKrill := false

	for _, sub := range sysinstallCmd.Commands() {
		if sub.Name() == "calamares" {
			hasCalamares = true
		}
		if sub.Name() == "krill" {
			hasKrill = true
		}
	}

	if !hasCalamares {
		t.Errorf("sysinstallCmd missing 'calamares' subcommand")
	}
	if !hasKrill {
		t.Errorf("sysinstallCmd missing 'krill' subcommand")
	}
}

func TestAnonymousFlags(t *testing.T) {
	if remasterCmd.Flags().Lookup("anonymous") == nil {
		t.Errorf("remasterCmd missing '--anonymous' flag")
	}
	if sysinstallCmd.PersistentFlags().Lookup("anonymous") == nil {
		t.Errorf("sysinstallCmd missing '--anonymous' persistent flag")
	}
}
