package engine

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSharedHomeInventory(t *testing.T) {
	for _, tc := range []struct {
		paths []string
		want  string
		fail  bool
	}{
		{nil, "", false},
		{[]string{"/dev/sdb2"}, "/dev/sdb2", false},
		{[]string{"/dev/sdb2", "/dev/sdb2"}, "/dev/sdb2", false},
		{[]string{"/dev/sdc2", "/dev/sdb2"}, "", true},
	} {
		got, err := UniqueSharedHome(tc.paths)
		if got != tc.want || (err != nil) != tc.fail {
			t.Fatalf("%v: got %s, %v", tc.paths, got, err)
		}
		if tc.fail && (!strings.Contains(err.Error(), "/dev/sdc2") || !strings.Contains(err.Error(), "/dev/sdb2")) {
			t.Fatal("duplicates not identified")
		}
	}
}

func TestRootTargetMetadata(t *testing.T) {
	for _, tc := range []struct {
		name, fields string
		allowed      bool
	}{
		{"raw", `"fstype":null`, true},
		{"ordinary filesystem", `"fstype":"ext4","label":"debian"`, true},
		{"shared ext4", `"fstype":"ext4","label":"SHARED_HOMES"`, false},
		{"shared other filesystem", `"fstype":"ntfs","label":"SHARED_HOMES"`, false},
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

func TestStorageRejectionBeforeCommands(t *testing.T) {
	for _, mode := range []string{"replace", "coexist"} {
		p := coexistPlan()
		p.Mode = mode
		c, commands := testContext(t, p)
		c.checks.rootTarget = func(string) error { return errors.New("protected SHARED_HOMES") }
		if err := runPartition(c); err == nil || len(*commands) != 0 {
			t.Fatal("protected ROOT allowed writes")
		}
	}
	for _, shared := range []bool{false, true} {
		for _, failure := range []error{errors.New("duplicate SHARED_HOMES"), errors.New("lsblk failed")} {
			p := coexistPlan()
			if !shared {
				p.HomePartition = ""
			}
			c, commands := testContext(t, p)
			c.checks.sharedHome = func() (string, error) { return "", failure }
			if err := runPartition(c); err == nil || len(*commands) != 0 {
				t.Fatal("inventory failure allowed writes")
			}
		}
	}
}

func TestRootHomeInstallMountsEFIAndLeavesSharedStorageAlone(t *testing.T) {
	for _, fs := range []string{"ext4", "btrfs"} {
		p := coexistPlan()
		p.FsType, p.HomePartition, p.PreviousID = fs, "", "arch"
		c, commands := testContext(t, p)
		c.checks.sharedHome = func() (string, error) { return "/dev/other2", nil }
		c.checks.inspectHome = func(string, string) error { t.Fatal("inspected unused shared HOME"); return nil }
		probe := c.checks.filesystem
		c.checks.filesystem = func(device string) (filesystemInfo, error) {
			if device != p.TargetPartition && device != p.EspPartition {
				t.Fatalf("probed unused HOME: %q", device)
			}
			return probe(device)
		}
		if err := validatePlan(p, *c.checks); err != nil {
			t.Fatal(err)
		}
		sharedPath := c.tpath("srv", "homes", "arch")
		if err := os.MkdirAll(sharedPath, 0755); err != nil {
			t.Fatal(err)
		}
		data := filepath.Join(sharedPath, "keep")
		if err := os.WriteFile(data, []byte("user data"), 0600); err != nil {
			t.Fatal(err)
		}
		if err := runMount(c); err != nil {
			t.Fatal(err)
		}
		if err := runCoexistMount(c); err != nil {
			t.Fatal(err)
		}
		if err := os.MkdirAll(c.tpath("etc"), 0755); err != nil {
			t.Fatal(err)
		}
		if err := runFstab(c); err != nil {
			t.Fatal(err)
		}
		fstab, err := os.ReadFile(c.tpath("etc", "fstab"))
		if err != nil {
			t.Fatal(err)
		}
		if strings.Contains(string(fstab), "/home") || !strings.Contains(string(fstab), "/boot/efi") {
			t.Fatalf("wrong local HOME fstab: %s", fstab)
		}
		if got, err := os.ReadFile(data); err != nil || string(got) != "user data" {
			t.Fatal("unused shared HOME changed")
		}
		cmds := strings.Join(*commands, "\n")
		if strings.Contains(cmds, "mount --bind") || strings.Contains(cmds, "/dev/other2") || !strings.Contains(cmds, "mount -t vfat "+p.EspPartition) {
			t.Fatalf("wrong mounts: %s", cmds)
		}
	}
}

func TestLocalHomeStillChecksPreviousEFI(t *testing.T) {
	p := coexistPlan()
	p.HomePartition, p.PreviousID = "", "arch"
	c, commands := testContext(t, p)
	c.checks.inspectEFI = func(_ string, id string) error {
		if id == "arch" {
			return errors.New("unsafe previous EFI")
		}
		return nil
	}
	if err := runPartition(c); err == nil || len(*commands) != 0 {
		t.Fatal("local HOME bypassed previous EFI safety")
	}
}

func TestRootHomePreparationHasOnlyESPAndRoots(t *testing.T) {
	for _, sector := range []uint64{512, 4096} {
		l, err := CalculateCoexistLayoutWithoutHome("/dev/test", 22<<30, sector, CoexistRootBytes)
		if err != nil {
			t.Fatal(err)
		}
		if !l.HomeOnRoot || l.ExternalHome.Partition != "" || len(l.Partitions) != 3 {
			t.Fatal("unexpected ROOT-only layout")
		}
		for _, p := range l.Partitions[1:] {
			if !IsGenericRootLabel(p.Label) || p.Sectors*sector != CoexistRootBytes {
				t.Fatal("HOME allocated in ROOT-only layout")
			}
		}
		c, commands := testContext(t, &Plan{Device: l.Device})
		if err := initializeCoexistDisk(c, l, l.Device, func(string, string, uint64) (CoexistDiskLayout, error) { return l, nil }); err != nil {
			t.Fatal(err)
		}
		if strings.Contains(strings.Join(*commands, "\n"), SharedHomeLabel) {
			t.Fatal("shared HOME created without request")
		}
	}
}
