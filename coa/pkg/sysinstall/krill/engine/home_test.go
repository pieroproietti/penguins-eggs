package engine

import (
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

func TestHomePreflight(t *testing.T) {
	cases := []struct {
		name   string
		change func(*Plan, *partitionChecks)
	}{
		{"missing", func(p *Plan, _ *partitionChecks) { p.HomePartition = "" }},
		{"root collision", func(p *Plan, _ *partitionChecks) { p.HomePartition = p.TargetPartition }},
		{"ESP collision", func(p *Plan, _ *partitionChecks) { p.HomePartition = p.EspPartition }},
		{"root alias", func(_ *Plan, c *partitionChecks) {
			c.partition = func(s string) (string, error) {
				if s == "/dev/test2" {
					return "/dev/test5", nil
				}
				return s, nil
			}
		}},
		{"ESP alias", func(_ *Plan, c *partitionChecks) {
			c.partition = func(s string) (string, error) {
				if s == "/dev/test2" {
					return "/dev/test1", nil
				}
				return s, nil
			}
		}},
		{"unreadable", func(_ *Plan, c *partitionChecks) {
			c.filesystem = func(string) (filesystemInfo, error) { return filesystemInfo{}, errors.New("unreadable") }
		}},
		{"unsupported", func(_ *Plan, c *partitionChecks) {
			c.filesystem = func(string) (filesystemInfo, error) { return filesystemInfo{Type: "btrfs", UUID: "uuid"}, nil }
		}},
		{"missing UUID", func(_ *Plan, c *partitionChecks) {
			c.filesystem = func(string) (filesystemInfo, error) { return filesystemInfo{Type: "ext4"}, nil }
		}},
		{"mount failed", func(_ *Plan, c *partitionChecks) {
			c.inspectHome = func(string, string) error { return errors.New("mount failed") }
		}},
		{"namespace is a file", func(p *Plan, c *partitionChecks) {
			storage := t.TempDir()
			if err := os.WriteFile(filepath.Join(storage, p.HomeNamespace), nil, 0644); err != nil {
				t.Fatal(err)
			}
			c.inspectHome = func(_ string, ns string) error { return validateHomeDestination(storage, ns) }
		}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			p, checks := coexistPlan(), safeChecks()
			tc.change(p, &checks)
			c := &ctx{plan: p, checks: &checks, execute: func(string, string, ...string) error { t.Fatal("destructive command before validation"); return nil }}
			if err := runPartition(c); err == nil {
				t.Fatal("unsafe HOME accepted")
			}
		})
	}
	for _, ns := range []string{"", ".", "..", "../arch", "arch/home", "a b", "a\nb", "a\\b", "-arch", "common", strings.Repeat("a", 65)} {
		t.Run("namespace "+ns, func(t *testing.T) {
			p := coexistPlan()
			p.HomeNamespace = ns
			if err := validatePlan(p, safeChecks()); err == nil {
				t.Fatal("unsafe namespace accepted")
			}
		})
	}
}

func TestNamespaceRejectsSymlinksAndPreservesSiblings(t *testing.T) {
	dir := t.TempDir()
	if err := os.Symlink("missing", filepath.Join(dir, "arch")); err != nil {
		t.Fatal(err)
	}
	if err := validateHomeDestination(dir, "arch"); err == nil {
		t.Fatal("dangling symlink accepted")
	}
	if err := validateHomeDestination(dir, "debian-sid"); err != nil {
		t.Fatal(err)
	}
}

func testContext(t *testing.T, p *Plan) (*ctx, *[]string) {
	t.Helper()
	p.Target = t.TempDir()
	log, err := os.CreateTemp(t.TempDir(), "log")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := log.Close(); err != nil {
			t.Error(err)
		}
	})
	checks := safeChecks()
	checks.filesystem = func(device string) (filesystemInfo, error) {
		fs := "ext4"
		if device == p.TargetPartition {
			fs = p.FsType
		}
		if device == p.EspPartition {
			fs = "vfat"
		}
		return filesystemInfo{Type: fs, UUID: filepath.Base(device) + "-uuid"}, nil
	}
	commands := []string{}
	c := &ctx{plan: p, checks: &checks, log: log, execute: func(_ string, name string, args ...string) error {
		commands = append(commands, strings.Join(append([]string{name}, args...), " "))
		return nil
	}}
	return c, &commands
}

func TestSharedMountAndFstab(t *testing.T) {
	for _, fs := range []string{"ext4", "btrfs"} {
		t.Run(fs, func(t *testing.T) {
			p := coexistPlan()
			p.FsType = fs
			c, commands := testContext(t, p)
			storage := c.tpath("srv", "homes")
			for _, sibling := range []string{"arch", "common"} {
				if err := os.MkdirAll(filepath.Join(storage, sibling), 0755); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile(filepath.Join(storage, sibling, "keep"), []byte("unchanged"), 0600); err != nil {
					t.Fatal(err)
				}
			}
			if err := runCoexistMount(c); err != nil {
				t.Fatal(err)
			}
			want := []string{
				"mount -t ext4 /dev/test2 " + storage,
				"mount --bind " + filepath.Join(storage, p.HomeNamespace) + " " + c.tpath("home"),
				"mount -t vfat /dev/test1 " + c.tpath("boot", "efi"),
			}
			if !reflect.DeepEqual(*commands, want) {
				t.Fatalf("mounts: %q", *commands)
			}
			if err := os.MkdirAll(c.tpath("etc"), 0755); err != nil {
				t.Fatal(err)
			}
			if err := runFstab(c); err != nil {
				t.Fatal(err)
			}
			data, err := os.ReadFile(c.tpath("etc", "fstab"))
			if err != nil {
				t.Fatal(err)
			}
			text := string(data)
			for _, entry := range []string{"UUID=test2-uuid /srv/homes ext4 defaults,noatime 0 2", "/srv/homes/colibri-1 /home none bind 0 0", "UUID=test1-uuid /boot/efi vfat", "UUID=test5-uuid / "} {
				if !strings.Contains(text, entry) {
					t.Fatalf("missing %q in %s", entry, text)
				}
			}
			if strings.Contains(text, "LABEL=") {
				t.Fatal("descriptive label used instead of UUID")
			}
			if strings.Count(text, " /home ") != 1 || strings.Contains(text, "@home") {
				t.Fatal("competing HOME entry")
			}
			for _, sibling := range []string{"arch", "common"} {
				data, err := os.ReadFile(filepath.Join(storage, sibling, "keep"))
				if err != nil || string(data) != "unchanged" {
					t.Fatal("sibling modified")
				}
			}
			if err := runCoexistMount(c); err != nil {
				t.Fatalf("existing namespace rejected: %v", err)
			}
		})
	}
}

func TestCoexistTabulaRasaCleansExistingHomeNamespace(t *testing.T) {
	p := coexistPlan()
	c, _ := testContext(t, p)
	storage := c.tpath("srv", "homes")
	namespace := filepath.Join(storage, p.HomeNamespace)
	if err := os.MkdirAll(namespace, 0755); err != nil {
		t.Fatal(err)
	}
	stale := filepath.Join(namespace, "stale")
	if err := os.WriteFile(stale, []byte("stale-data"), 0600); err != nil {
		t.Fatal(err)
	}
	sibling := filepath.Join(storage, "sibling")
	if err := os.MkdirAll(sibling, 0755); err != nil {
		t.Fatal(err)
	}
	siblingFile := filepath.Join(sibling, "keep")
	if err := os.WriteFile(siblingFile, []byte("preserve"), 0600); err != nil {
		t.Fatal(err)
	}

	c.checks.inspectHome = func(_ string, ns string) error { return validateHomeDestination(storage, ns) }
	if err := validatePlan(p, *c.checks); err != nil {
		t.Fatalf("preflight rejected existing HOME: %v", err)
	}

	if err := runCoexistMount(c); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(stale); !os.IsNotExist(err) {
		t.Fatalf("existing HOME namespace was not cleaned: %v", err)
	}
	data, err := os.ReadFile(siblingFile)
	if err != nil || string(data) != "preserve" {
		t.Fatalf("sibling HOME changed: %q, %v", data, err)
	}
}

func TestCoexistCleansPreviousInstallationSlot(t *testing.T) {
	p := coexistPlan()
	p.HomeNamespace = "debian"
	p.EFIBootloaderID = "debian"
	p.PreviousID = "arch"

	c, _ := testContext(t, p)
	storage := c.tpath("srv", "homes")
	esp := c.tpath("boot", "efi")

	// Setup previous arch home and efi
	archHome := filepath.Join(storage, "arch")
	if err := os.MkdirAll(filepath.Join(archHome, "user"), 0755); err != nil {
		t.Fatal(err)
	}
	archFile := filepath.Join(archHome, "user", "file.txt")
	if err := os.WriteFile(archFile, []byte("arch data"), 0600); err != nil {
		t.Fatal(err)
	}

	// Setup sibling home (e.g. fedora) to ensure it is preserved
	siblingHome := filepath.Join(storage, "fedora")
	if err := os.MkdirAll(siblingHome, 0755); err != nil {
		t.Fatal(err)
	}
	siblingFile := filepath.Join(siblingHome, "keep")
	if err := os.WriteFile(siblingFile, []byte("fedora data"), 0600); err != nil {
		t.Fatal(err)
	}

	// Setup previous arch EFI and sibling EFI
	archEFI := filepath.Join(esp, "EFI", "arch")
	if err := os.MkdirAll(archEFI, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(archEFI, "grubx64.efi"), []byte("stub"), 0644); err != nil {
		t.Fatal(err)
	}
	siblingEFI := filepath.Join(esp, "EFI", "fedora")
	if err := os.MkdirAll(siblingEFI, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(siblingEFI, "grubx64.efi"), []byte("fedora-efi"), 0644); err != nil {
		t.Fatal(err)
	}

	if err := runCoexistMount(c); err != nil {
		t.Fatalf("runCoexistMount failed: %v", err)
	}

	// Previous arch home must be deleted
	if _, err := os.Stat(archHome); !os.IsNotExist(err) {
		t.Errorf("previous arch HOME was not cleaned: %v", err)
	}
	// Sibling fedora home must remain intact
	if data, err := os.ReadFile(siblingFile); err != nil || string(data) != "fedora data" {
		t.Errorf("sibling fedora HOME modified: %q, %v", data, err)
	}
	// New debian home namespace must exist
	if info, err := os.Stat(filepath.Join(storage, "debian")); err != nil || !info.IsDir() {
		t.Errorf("new debian HOME namespace was not created")
	}

	// Previous arch EFI must be deleted
	if _, err := os.Stat(archEFI); !os.IsNotExist(err) {
		t.Errorf("previous arch EFI was not cleaned: %v", err)
	}
	// Sibling fedora EFI must remain intact
	if data, err := os.ReadFile(filepath.Join(siblingEFI, "grubx64.efi")); err != nil || string(data) != "fedora-efi" {
		t.Errorf("sibling fedora EFI modified: %q, %v", data, err)
	}
}

func TestCoexistFstabProbeFailure(t *testing.T) {
	for _, device := range []string{"/dev/test5", "/dev/test1", "/dev/test2"} {
		t.Run(device, func(t *testing.T) {
			c, _ := testContext(t, coexistPlan())
			probe := c.checks.filesystem
			c.checks.filesystem = func(d string) (filesystemInfo, error) {
				if d == device {
					return filesystemInfo{}, errors.New("probe failed")
				}
				return probe(d)
			}
			if err := runFstab(c); err == nil {
				t.Fatal("failed UUID lookup accepted")
			}
			if _, err := os.Stat(c.tpath("etc", "fstab")); !os.IsNotExist(err) {
				t.Fatal("invalid fstab written")
			}
		})
	}
}

func TestInstallationSequence(t *testing.T) {
	seq := []string{"partition", "mount", "unpackfs", "removeuser", "machineid", "fstab", "users", "umount"}
	p := coexistPlan()
	p.Exec = seq
	got, err := installationSequence(p)
	if err != nil {
		t.Fatal(err)
	}
	want := []string{"partition", "mount", "unpackfs", "removeuser", "coexistmount", "machineid", "fstab", "users", "umount"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("sequence: %q", got)
	}
	for _, mode := range []string{"replace", "erase"} {
		p.Mode = mode
		got, err = installationSequence(p)
		if err != nil || !reflect.DeepEqual(got, seq) {
			t.Fatal("legacy sequence changed")
		}
	}
	p.Mode = "coexist"
	for _, bad := range [][]string{{"partition", "mount", "unpackfs", "users", "removeuser", "fstab", "umount"}, {"partition", "mount", "unpackfs", "removeuser", "fstab", "umount"}} {
		p.Exec = bad
		if _, err := installationSequence(p); err == nil {
			t.Fatal("unsafe sequence accepted")
		}
	}
}

func TestSharedMountRejectsImageSymlinks(t *testing.T) {
	c, _ := testContext(t, coexistPlan())
	if err := os.Symlink(t.TempDir(), c.tpath("srv")); err != nil {
		t.Fatal(err)
	}
	if err := runCoexistMount(c); err == nil {
		t.Fatal("symlink mountpoint accepted")
	}
}

func TestBtrfsMountCompatibility(t *testing.T) {
	for _, mode := range []string{"coexist", "replace", "erase"} {
		t.Run(mode, func(t *testing.T) {
			p := coexistPlan()
			p.Mode, p.FsType = mode, "btrfs"
			c, commands := testContext(t, p)
			if err := runMount(c); err != nil {
				t.Fatal(err)
			}
			text := strings.Join(*commands, "\n")
			if mode == "coexist" {
				if strings.Contains(text, "@home") || strings.Contains(text, p.HomePartition) || strings.Contains(text, p.EspPartition) {
					t.Fatalf("shared mount or competing @home before unpack: %s", text)
				}
			} else if !strings.Contains(text, "subvol=@home,") || !strings.Contains(text, "mount -t vfat") {
				t.Fatalf("legacy mounts changed: %s", text)
			}
		})
	}
}

func TestActualHomeModuleOrder(t *testing.T) {
	p := coexistPlan()
	// Reusing the live username must remove it first, then create it normally.
	p.RemoveUser, p.Login, p.UserPass = "piero", "piero", "password"
	p.Exec = []string{"partition", "mount", "unpackfs", "removeuser", "fstab", "users", "umount"}
	c, commands := testContext(t, p)
	bin := t.TempDir()
	if err := os.WriteFile(filepath.Join(bin, "unsquashfs"), []byte("#!/bin/sh\nexit 1\n"), 0755); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", bin)
	p.UnpackSource = filepath.Join(t.TempDir(), "source")
	if err := os.WriteFile(p.UnpackSource, nil, 0600); err != nil {
		t.Fatal(err)
	}
	original := c.execute
	c.execute = func(input, name string, args ...string) error {
		if err := original(input, name, args...); err != nil {
			return err
		}
		if name == "unsquashfs" {
			for _, mp := range c.mounts {
				if mp == c.tpath("srv", "homes") || mp == c.tpath("boot", "efi") {
					t.Fatal("shared filesystem mounted during unpack")
				}
			}
			if err := os.MkdirAll(c.tpath("etc"), 0755); err != nil {
				return err
			}
		}
		if name == "chroot" && len(args) > 1 && args[1] == "userdel" {
			for _, mp := range c.mounts {
				if mp == c.tpath("home") {
					t.Fatal("shared home exposed to userdel")
				}
			}
		}
		if name == "chroot" && len(args) > 1 && args[1] == "useradd" {
			bound := false
			for _, mp := range c.mounts {
				if mp == c.tpath("home") {
					bound = true
				}
			}
			if !bound {
				t.Fatal("useradd before home bind mount")
			}
			if args[2] != "-m" {
				t.Fatal("normal home creation disabled")
			}
		}
		return nil
	}
	seq, err := installationSequence(p)
	if err != nil {
		t.Fatal(err)
	}
	for _, name := range seq {
		if err := modules()[name](c); err != nil {
			t.Fatalf("%s: %v", name, err)
		}
	}
	text := strings.Join(*commands, "\n")
	last := -1
	for _, fragment := range []string{"unsquashfs -f", "userdel -r piero", "mount -t ext4 /dev/test2", "mount --bind " + c.tpath("srv", "homes", p.HomeNamespace), "useradd -m"} {
		index := strings.Index(text, fragment)
		if index <= last {
			t.Fatalf("wrong order for %s: %s", fragment, text)
		}
		last = index
	}
}

func TestLegacyFstabHomeUnchanged(t *testing.T) {
	bin := t.TempDir()
	if err := os.WriteFile(filepath.Join(bin, "blkid"), []byte("#!/bin/sh\nprintf '%s\\n' test-uuid\n"), 0755); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", bin)
	for _, mode := range []string{"erase", "replace"} {
		for _, fs := range []string{"ext4", "btrfs"} {
			t.Run(mode+fs, func(t *testing.T) {
				p := coexistPlan()
				p.Mode, p.FsType = mode, fs
				c, _ := testContext(t, p)
				if err := os.MkdirAll(c.tpath("etc"), 0755); err != nil {
					t.Fatal(err)
				}
				if err := runFstab(c); err != nil {
					t.Fatal(err)
				}
				data, err := os.ReadFile(c.tpath("etc", "fstab"))
				if err != nil {
					t.Fatal(err)
				}
				text := string(data)
				if strings.Contains(text, "/srv/homes") || strings.Contains(text, "none bind") {
					t.Fatal("shared HOME added to legacy mode")
				}
				if strings.Contains(text, "subvol=/@home") != (fs == "btrfs") {
					t.Fatal("legacy Btrfs home changed")
				}
			})
		}
	}
}
