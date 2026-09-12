package engine

import (
	"strings"
	"testing"

	"coa/pkg/utils"
)

func TestObservedESPProperties(t *testing.T) {
	// Exact PARTTYPE/FSTYPE observed on the real installation's /dev/sda1.
	out, err := utils.ExecCapture("printf '%s\\n' 'c12a7328-f81f-11d2-ba4b-00a0c93ec93b vfat'")
	if err != nil {
		t.Fatal(err)
	}
	valid, err := parseESPProperties("/dev/sda1", out)
	if err != nil || !valid {
		t.Fatalf("valid ESP rejected: output=%q, error=%v", out, err)
	}
}

func TestESPPropertiesFailClosed(t *testing.T) {
	guid := "c12a7328-f81f-11d2-ba4b-00a0c93ec93b"
	for _, tc := range []struct {
		output         string
		valid, failure bool
	}{
		{strings.ToUpper(guid) + "\tVFAT\n", true, false},
		{"", false, true},
		{guid, false, true},
		{"vfat", false, true},
		{guid + " vfat\n" + guid + " vfat", false, true},
		{guid + " ext4", false, false},
		{guid + " fat32", false, false},
		{"0xef vfat", false, false},
		{"not-an-esp vfat", false, false},
	} {
		valid, err := parseESPProperties("/dev/sda1", tc.output)
		if valid != tc.valid || (err != nil) != tc.failure {
			t.Errorf("%q: valid=%t, error=%v", tc.output, valid, err)
		}
	}
}
