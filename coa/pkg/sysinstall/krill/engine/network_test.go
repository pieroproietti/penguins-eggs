package engine

import (
	"os"
	"path/filepath"
	"testing"
)

func TestMaskToPrefix(t *testing.T) {
	cases := []struct {
		mask string
		want int
	}{
		{"255.255.255.0", 24},
		{"255.255.0.0", 16},
		{"255.0.0.0", 8},
		{"255.255.255.128", 25},
		{"255.255.255.252", 30},
		{"", 24},        // fallback
		{"junk", 24},    // fallback
		{"1.2.3.4", 24}, // non è una netmask valida
	}
	for _, c := range cases {
		if got := maskToPrefix(c.mask); got != c.want {
			t.Errorf("maskToPrefix(%q) = %d, atteso %d", c.mask, got, c.want)
		}
	}
}

func TestRunNetworkcfgCleanup(t *testing.T) {
	target := t.TempDir()
	nmDir := filepath.Join(target, "etc", "NetworkManager", "system-connections")
	if err := os.MkdirAll(nmDir, 0755); err != nil {
		t.Fatalf("failed to create temp nmDir: %v", err)
	}

	staleFile := filepath.Join(nmDir, "stale-wifi.nmconnection")
	if err := os.WriteFile(staleFile, []byte("test"), 0600); err != nil {
		t.Fatalf("failed to write stale file: %v", err)
	}

	logFile, err := os.CreateTemp("", "krill-test-log-*")
	if err != nil {
		t.Fatalf("failed to create temp log file: %v", err)
	}
	defer os.Remove(logFile.Name())
	defer logFile.Close()

	c := &ctx{
		plan: &Plan{
			Target:  target,
			NetType: "dhcp",
		},
		log: logFile,
	}

	if err := runNetworkcfg(c); err != nil {
		t.Fatalf("runNetworkcfg failed: %v", err)
	}

	if exists(staleFile) {
		t.Errorf("stale connection file %s was not removed by runNetworkcfg", staleFile)
	}
}
