package engine

import (
	"testing"
)

func TestRootTargetMetadata(t *testing.T) {
	for _, tc := range []struct {
		name, fields string
		allowed      bool
	}{
		{"raw", `"fstype":null`, true},
		{"ordinary filesystem", `"fstype":"ext4","label":"debian"`, true},
		{"EFI", `"parttype":"c12a7328-f81f-11d2-ba4b-00a0c93ec93b"`, false},
		{"swap", `"fstype":"swap"`, false},
		{"mounted", `"mountpoints":[null,"/home"]`, false},
		{"read-only", `"ro":true`, false},
		{"mapped", `"children":[{"path":"/dev/mapper/data","type":"crypt"}]`, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			out := `{"blockdevices":[{"path":"/dev/test2","type":"part",` + tc.fields + `}]}`
			if err := validateRootTarget("/dev/test2", out); (err == nil) != tc.allowed {
				t.Fatalf("unexpected eligibility: %v", err)
			}
		})
	}
	out := `{"blockdevices":[{"path":"/dev/test","type":"disk","children":[{"path":"/dev/test1","type":"part","mountpoints":["/run/archiso/bootmnt"]},{"path":"/dev/test2","type":"part"}]}]}`
	if err := validateRootTarget("/dev/test2", out); err == nil {
		t.Fatal("offered another partition of the live disk")
	}
	for _, out := range []string{`{`, `{}`, `{"blockdevices":[]}`} {
		if err := validateRootTarget("/dev/test2", out); err == nil {
			t.Fatal("missing inventory accepted")
		}
	}
}
