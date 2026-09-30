package setup

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// useTempInstaller points the package at a scratch installer.d tree and
// fakes the systemd runtime marker.
func useTempInstaller(t *testing.T, systemd bool) string {
	t.Helper()
	root := t.TempDir()

	oldRoot, oldModules, oldMarker := InstallerDRoot, modulesDir, systemdRuntimePath
	InstallerDRoot = root
	modulesDir = filepath.Join(root, "modules")
	systemdRuntimePath = filepath.Join(root, "run-systemd-private")
	t.Cleanup(func() {
		InstallerDRoot, modulesDir, systemdRuntimePath = oldRoot, oldModules, oldMarker
	})

	if err := os.MkdirAll(modulesDir, 0755); err != nil {
		t.Fatal(err)
	}
	if systemd {
		if err := os.WriteFile(systemdRuntimePath, nil, 0644); err != nil {
			t.Fatal(err)
		}
	}
	return root
}

func readMachineIdConf(t *testing.T) string {
	t.Helper()
	data, err := os.ReadFile(filepath.Join(modulesDir, "machineid.conf"))
	if err != nil {
		t.Fatal(err)
	}
	return string(data)
}

func TestMachineIdConfWithoutSystemd(t *testing.T) {
	useTempInstaller(t, false)
	if err := machineIdConf(); err != nil {
		t.Fatal(err)
	}
	got := readMachineIdConf(t)
	if !strings.Contains(got, "\nsystemd: false\n") {
		t.Fatalf("expected systemd: false, got:\n%s", got)
	}
}

func TestMachineIdConfWithSystemd(t *testing.T) {
	useTempInstaller(t, true)
	if err := machineIdConf(); err != nil {
		t.Fatal(err)
	}
	got := readMachineIdConf(t)
	if !strings.Contains(got, "\nsystemd: true\n") {
		t.Fatalf("expected systemd: true, got:\n%s", got)
	}
}

// A costume may ship a machineid.conf written for systemd. Applied in the
// order used by BuildInstaller (overlay first, machineIdConf after), the
// init detected on a systemd-less live system must still win.
func TestMachineIdConfOverridesCostumeOverlay(t *testing.T) {
	root := useTempInstaller(t, false)

	oldBranding := calamaresModulesBranding
	calamaresModulesBranding = filepath.Join(root, "branding-modules")
	t.Cleanup(func() { calamaresModulesBranding = oldBranding })
	if err := os.MkdirAll(calamaresModulesBranding, 0755); err != nil {
		t.Fatal(err)
	}
	costume := "---\nsystemd: true\ndbus: true\n"
	if err := os.WriteFile(filepath.Join(calamaresModulesBranding, "machineid.conf"), []byte(costume), 0644); err != nil {
		t.Fatal(err)
	}

	if err := calamaresModulesOverlay(); err != nil {
		t.Fatal(err)
	}
	if got := readMachineIdConf(t); !strings.Contains(got, "systemd: true") {
		t.Fatalf("overlay did not install the costume file:\n%s", got)
	}

	if err := machineIdConf(); err != nil {
		t.Fatal(err)
	}
	got := readMachineIdConf(t)
	if !strings.Contains(got, "\nsystemd: false\n") {
		t.Fatalf("costume machineid.conf overrode the detected init:\n%s", got)
	}
}
