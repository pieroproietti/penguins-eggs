package engine

import (
	"testing"
)

func TestGenerateSlotSystemID(t *testing.T) {
	tests := []struct {
		device   string
		distro   string
		expected string
	}{
		{"/dev/sda2", "debian", "sda2-debian"},
		{"/dev/sdb3", "arch", "sdb3-arch"},
		{"/dev/vdb2", "ubuntu", "vdb2-ubuntu"},
		{"/dev/nvme0n1p2", "debian", "nvme0n1p2-debian"},
		{"/dev/nvme0n1p10", "debian", "nvme0n1p10-debia"}, // truncated to 16 chars
		{"/dev/sda2", "", "sda2-linux"},
	}

	for _, tc := range tests {
		got := GenerateSlotSystemID(tc.device, tc.distro)
		if got != tc.expected {
			t.Errorf("GenerateSlotSystemID(%q, %q) = %q, want %q", tc.device, tc.distro, got, tc.expected)
		}
		if len(got) > 16 {
			t.Errorf("GenerateSlotSystemID returned %q exceeding 16 chars (%d)", got, len(got))
		}
	}
}

func TestIsCoexistSignature(t *testing.T) {
	tests := []struct {
		partLabel string
		label     string
		expected  bool
	}{
		{"coexist-1", "", true},
		{"COEXIST-2", "", true},
		{"", "root1", true},
		{"", "ROOT2", true},
		{"", "root", true},
		{"", "coe-2", true},
		{"", "coe-3", true},
		{"", "sda2-debian", true},
		{"", "sdb3-arch", true},
		{"", "nvme0n1p2-debian", true},
		{"", "my-data", true}, // matches part pattern
		{"", "", false},
		{"", "Windows", false},
		{"", "DATA", false},
	}

	for _, tc := range tests {
		got := IsCoexistSignature(tc.partLabel, tc.label)
		if got != tc.expected {
			t.Errorf("IsCoexistSignature(%q, %q) = %v, want %v", tc.partLabel, tc.label, got, tc.expected)
		}
	}
}

func TestParseCoexistDisks(t *testing.T) {
	sampleJSON := `{
   "blockdevices": [
      {
         "path": "/dev/sda",
         "name": "sda",
         "size": 34359738368,
         "type": "disk",
         "pttype": "gpt",
         "children": [
            {
               "path": "/dev/sda1",
               "name": "sda1",
               "size": 536870912,
               "type": "part",
               "fstype": "vfat",
               "parttype": "c12a7328-f81f-11d2-ba4b-00a0c93ec93b",
               "mountpoints": []
            },{
               "path": "/dev/sda2",
               "name": "sda2",
               "size": 10737418240,
               "type": "part",
               "fstype": "ext4",
               "label": "coe-2",
               "parttype": "0fc63daf-8483-4772-8e79-3d69d8477de4",
               "mountpoints": []
            },{
               "path": "/dev/sda3",
               "name": "sda3",
               "size": 11541676032,
               "type": "part",
               "fstype": "ext4",
               "label": "coe-3",
               "parttype": "0fc63daf-8483-4772-8e79-3d69d8477de4",
               "mountpoints": []
            },{
               "path": "/dev/sda4",
               "name": "sda4",
               "size": 11541676032,
               "type": "part",
               "fstype": "ext4",
               "parttype": "0fc63daf-8483-4772-8e79-3d69d8477de4",
               "mountpoints": []
            }
         ]
      },{
         "path": "/dev/sdb",
         "name": "sdb",
         "size": 34359738368,
         "type": "disk",
         "pttype": "gpt",
         "children": [
            {
               "path": "/dev/sdb1",
               "name": "sdb1",
               "size": 314572800,
               "type": "part",
               "fstype": "vfat",
               "parttype": "c12a7328-f81f-11d2-ba4b-00a0c93ec93b",
               "mountpoints": ["/boot/efi"]
            },{
               "path": "/dev/sdb2",
               "name": "sdb2",
               "size": 34043068416,
               "type": "part",
               "fstype": "ext4",
               "parttype": "0fc63daf-8483-4772-8e79-3d69d8477de4",
               "mountpoints": ["/"]
            }
         ]
      }
   ]
}`

	reports := parseCoexistDisks(sampleJSON)
	if len(reports) != 1 {
		t.Fatalf("expected 1 coexist disk report, got %d", len(reports))
	}

	r := reports[0]
	if r.Device != "/dev/sda" {
		t.Errorf("expected /dev/sda, got %s", r.Device)
	}
	if r.EspDevice != "/dev/sda1" {
		t.Errorf("expected ESP /dev/sda1, got %s", r.EspDevice)
	}
	if len(r.Slots) != 3 {
		t.Errorf("expected 3 slots, got %d", len(r.Slots))
	}
	if r.Slots[0].Device != "/dev/sda2" || !r.Slots[0].IsFree {
		t.Errorf("slot 0 mismatch: %+v", r.Slots[0])
	}
}
