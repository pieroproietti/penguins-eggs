package engine

import (
	"errors"
	"os"
	"reflect"
	"runtime"
	"strings"
	"testing"
)

func safeChecks() partitionChecks {
	return partitionChecks{
		rootTarget: func(string) error { return nil },
		sharedHome: func() (string, error) { return "/dev/test2", nil },
		uefi:       func() bool { return true },
		partition:  func(s string) (string, error) { return s, nil },
		esp:        func(string) (bool, error) { return true, nil },
		inUse:      func(string) (bool, error) { return false, nil },
		filesystem: func(device string) (filesystemInfo, error) {
			fs := "ext4"
			if device == "/dev/test1" {
				fs = "vfat"
			}
			return filesystemInfo{Type: fs, UUID: "test-uuid", Label: SharedHomeLabel}, nil
		},
		inspectHome: func(string, string) error { return nil },
		family:      func() string { return "debian" },
		inspectEFI:  func(string, string) error { return nil },
		identities:  func(*Plan) error { return nil },
		disk:        func(string, string, string) error { return nil },
	}
}

func coexistPlan() *Plan {
	return &Plan{Mode: "coexist", EFIBootloaderID: "colibri-1", HomePartition: "/dev/test2", HomeNamespace: "colibri-1", Device: "/dev/test", TargetPartition: "/dev/test5", EspPartition: "/dev/test1", FsType: "ext4", TableType: "gpt", Swap: "none"}
}

func TestCoexistSafety(t *testing.T) {
	cases := []struct {
		name   string
		change func(*Plan, *partitionChecks)
	}{
		{"unknown", func(p *Plan, _ *partitionChecks) { p.Mode = "typo" }},
		{"BIOS with GPT", func(_ *Plan, c *partitionChecks) { c.uefi = func() bool { return false } }},
		{"missing root", func(p *Plan, _ *partitionChecks) { p.TargetPartition = "" }},
		{"missing disk", func(p *Plan, _ *partitionChecks) { p.Device = "" }},
		{"disk inspection unavailable", func(_ *Plan, c *partitionChecks) { c.disk = nil }},
		{"disk inspection failed", func(_ *Plan, c *partitionChecks) {
			c.disk = func(string, string, string) error { return errors.New("wrong disk") }
		}},
		{"missing ESP", func(p *Plan, _ *partitionChecks) { p.EspPartition = "" }},
		{"same partition", func(p *Plan, _ *partitionChecks) { p.EspPartition = p.TargetPartition }},
		{"alias", func(_ *Plan, c *partitionChecks) {
			c.partition = func(string) (string, error) { return "/dev/same", nil }
		}},
		{"not partition", func(_ *Plan, c *partitionChecks) {
			c.partition = func(string) (string, error) { return "", errors.New("not a partition") }
		}},
		{"not ESP", func(_ *Plan, c *partitionChecks) { c.esp = func(string) (bool, error) { return false, nil } }},
		{"ESP probe failed", func(_ *Plan, c *partitionChecks) {
			c.esp = func(string) (bool, error) { return false, errors.New("probe failed") }
		}},
		{"in-use probe failed", func(_ *Plan, c *partitionChecks) {
			c.inUse = func(string) (bool, error) { return false, errors.New("probe failed") }
		}},
		{"mounted root", func(_ *Plan, c *partitionChecks) { c.inUse = func(string) (bool, error) { return true, nil } }},
		{"partition swap", func(p *Plan, _ *partitionChecks) { p.Swap = "small" }},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			p, checks := coexistPlan(), safeChecks()
			tc.change(p, &checks)
			c := &ctx{plan: p, checks: &checks, execute: func(string, string, ...string) error { t.Fatal("command executed before validation"); return nil }}
			if err := runPartition(c); err == nil {
				t.Fatal("unsafe plan accepted")
			}
		})
	}
}

func TestPartitionDispatchCommands(t *testing.T) {
	if runtime.GOARCH == "riscv64" {
		t.Skip("erase uses the separate Spacemit layout")
	}
	for _, mode := range []string{"erase", "replace", "coexist"} {
		t.Run(mode, func(t *testing.T) {
			p, checks := coexistPlan(), safeChecks()
			p.Mode = mode
			log, err := os.CreateTemp(t.TempDir(), "log")
			if err != nil {
				t.Fatal(err)
			}
			defer log.Close()
			var commands []string
			c := &ctx{plan: p, checks: &checks, log: log, execute: func(_ string, name string, args ...string) error {
				commands = append(commands, strings.Join(append([]string{name}, args...), " "))
				return nil
			}}
			if err := runPartition(c); err != nil {
				t.Fatal(err)
			}
			want := []string{"wipefs -a /dev/test5", "mkfs.ext4 -F /dev/test5", "udevadm settle"}
			if mode == "coexist" {
				want[1] = "mkfs.ext4 -F -L colibri-1 /dev/test5"
			}
			if mode == "erase" {
				want = []string{"wipefs -a /dev/test", "sfdisk --wipe always /dev/test", "udevadm settle", "wipefs -a /dev/test1", "mkfs.fat -F32 /dev/test1", "wipefs -a /dev/test2", "mkfs.ext4 -F /dev/test2"}
			}
			if !reflect.DeepEqual(commands, want) {
				t.Fatalf("commands = %q, want %q", commands, want)
			}
		})
	}
}

func TestCoexistRootLabelIsValidatedBeforeWipe(t *testing.T) {
	p, checks := coexistPlan(), safeChecks()
	p.EFIBootloaderID = strings.Repeat("a", 17)
	var commands []string
	c := &ctx{plan: p, checks: &checks, execute: func(_ string, name string, args ...string) error {
		commands = append(commands, strings.Join(append([]string{name}, args...), " "))
		return nil
	}}

	if err := runPartition(c); err == nil || !strings.Contains(err.Error(), "1–16 ASCII") {
		t.Fatalf("long ext4 label error = %v", err)
	}
	if len(commands) != 0 {
		t.Fatalf("commands ran before invalid label was rejected: %q", commands)
	}
}

func TestCoexistRootLabelAtInstallationIDLimit(t *testing.T) {
	p, checks := coexistPlan(), safeChecks()
	p.FsType = "btrfs"
	p.EFIBootloaderID = strings.Repeat("a", 16)
	p.HomeNamespace = p.EFIBootloaderID
	var commands []string
	c := &ctx{plan: p, checks: &checks, execute: func(_ string, name string, args ...string) error {
		commands = append(commands, strings.Join(append([]string{name}, args...), " "))
		return nil
	}}

	if err := runPartition(c); err != nil {
		t.Fatal(err)
	}
	want := "mkfs.btrfs -f -L " + p.EFIBootloaderID + " /dev/test5"
	if len(commands) < 2 || commands[1] != want {
		t.Fatalf("commands = %q, want mkfs command %q", commands, want)
	}
}

func TestReplaceRootDoesNotAcquireCoexistLabel(t *testing.T) {
	p, checks := coexistPlan(), safeChecks()
	p.Mode = "replace"
	var commands []string
	c := &ctx{plan: p, checks: &checks, execute: func(_ string, name string, args ...string) error {
		commands = append(commands, strings.Join(append([]string{name}, args...), " "))
		return nil
	}}

	if err := runPartition(c); err != nil {
		t.Fatal(err)
	}
	if strings.Contains(strings.Join(commands, "\n"), "-L ") {
		t.Fatalf("Replace unexpectedly received a filesystem label: %q", commands)
	}
}

func TestCoexistLayoutAndFirmwareIndependentOfTable(t *testing.T) {
	p := coexistPlan()
	p.TableType = "msdos"
	if err := validatePlan(p, safeChecks()); err != nil {
		t.Fatal(err)
	}
	if got := partsFor(p); got != (layout{Root: p.TargetPartition, Esp: p.EspPartition}) {
		t.Fatalf("wrong layout: %+v", got)
	}
}

func TestLegacyValidationUnchanged(t *testing.T) {
	for _, mode := range []string{"erase", "replace"} {
		if err := validatePlan(&Plan{Mode: mode, TargetPartition: "/dev/test5"}, safeChecks()); err != nil {
			t.Fatal(err)
		}
	}
}

func TestCanonicalPartitionRejectsRegularFile(t *testing.T) {
	f, err := os.CreateTemp(t.TempDir(), "not-device")
	if err != nil {
		t.Fatal(err)
	}
	if err := f.Close(); err != nil {
		t.Fatal(err)
	}
	if _, err := canonicalPartition(f.Name()); err == nil {
		t.Fatal("regular file accepted")
	}
}

func TestWholeDiskEntryRejectsCoexist(t *testing.T) {
	c := &ctx{plan: coexistPlan(), execute: func(string, string, ...string) error {
		t.Fatal("whole-disk command executed")
		return nil
	}}
	if err := runErase(c); err == nil {
		t.Fatal("Coexist entered whole-disk path")
	}
}

func TestRootWipeFailure(t *testing.T) {
	for _, mode := range []string{"replace", "coexist"} {
		t.Run(mode, func(t *testing.T) {
			p, checks := coexistPlan(), safeChecks()
			p.Mode = mode
			log, err := os.CreateTemp(t.TempDir(), "log")
			if err != nil {
				t.Fatal(err)
			}
			defer log.Close()
			formatted := false
			c := &ctx{plan: p, checks: &checks, log: log, execute: func(_ string, name string, _ ...string) error {
				if name == "wipefs" {
					return errors.New("wipe failed")
				}
				if name == "mkfs.ext4" {
					formatted = true
				}
				return nil
			}}
			err = runPartition(c)
			if mode == "coexist" && (err == nil || formatted) {
				t.Fatal("Coexist continued after failed wipe")
			}
			if mode == "replace" && (err != nil || !formatted) {
				t.Fatal("legacy Replace behavior changed")
			}
		})
	}
}

func TestCoexistDiskBoundaryBeforeFormatting(t *testing.T) {
	const tree = `{"blockdevices":[{"path":"/dev/test","type":"disk","children":[
		{"path":"/dev/test1","type":"part","fstype":"vfat","parttype":"c12a7328-f81f-11d2-ba4b-00a0c93ec93b"},
		{"path":"/dev/test5","type":"part","fstype":null,"parttype":"0fc63daf-8483-4772-8e79-3d69d8477de4"}
	]}]}`
	for _, tc := range []struct {
		name, root, esp, tree string
		valid                 bool
	}{
		{"existing raw ROOT", "/dev/test5", "/dev/test1", tree, true},
		{"external ROOT", "/dev/other5", "/dev/test1", tree, false},
		{"external ESP", "/dev/test5", "/dev/other1", tree, false},
		{"whole disk ROOT", "/dev/test", "/dev/test1", tree, false},
		{"missing ROOT", "/dev/test6", "/dev/test1", tree, false},
		{"ESP as ROOT", "/dev/test1", "/dev/test5", tree, false},
		{"missing ESP", "/dev/test5", "/dev/test1", strings.ReplaceAll(tree, "vfat", "ext4"), false},
		{"multiple ESPs", "/dev/test5", "/dev/test1", strings.Replace(tree, `"children":[`, `"children":[{"path":"/dev/test3","type":"part","fstype":"vfat","parttype":"c12a7328-f81f-11d2-ba4b-00a0c93ec93b"},`, 1), false},
		{"wrong disk", "/dev/test5", "/dev/test1", strings.Replace(tree, `"path":"/dev/test"`, `"path":"/dev/other"`, 1), false},
		{"not a disk", "/dev/test5", "/dev/test1", strings.Replace(tree, `"type":"disk"`, `"type":"part"`, 1), false},
		{"probe malformed", "/dev/test5", "/dev/test1", `{`, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			p, checks := coexistPlan(), safeChecks()
			p.TargetPartition, p.EspPartition = tc.root, tc.esp
			p.HomePartition = "/dev/external2"
			checks.sharedHome = func() (string, error) { return p.HomePartition, nil }
			checks.disk = func(device, root, esp string) error {
				return validateCoexistDiskTree(device, root, esp, tc.tree)
			}
			commands := 0
			c := &ctx{plan: p, checks: &checks, execute: func(string, string, ...string) error {
				commands++
				return nil
			}}
			err := runPartition(c)
			if (err == nil) != tc.valid || (!tc.valid && commands != 0) {
				t.Fatalf("validation error=%v, commands=%d, valid=%t", err, commands, tc.valid)
			}
		})
	}
}
