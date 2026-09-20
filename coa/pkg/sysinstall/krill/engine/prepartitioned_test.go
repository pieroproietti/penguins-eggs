package engine

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestPartsForWithHomePartition(t *testing.T) {
	plan := &Plan{
		Device:          "/dev/sda",
		Mode:            "replace",
		TargetPartition: "/dev/sda4",
		EspPartition:    "/dev/sda3",
		HomePartition:   "/dev/sda5",
	}
	l := partsFor(plan)
	if l.Esp != "/dev/sda3" || l.Root != "/dev/sda4" || l.Home != "/dev/sda5" {
		t.Fatalf("unexpected layout: %+v", l)
	}
}

func TestRunFstabWithSeparateHomeAndEsp(t *testing.T) {
	target := t.TempDir()
	etcDir := filepath.Join(target, "etc")
	if err := os.MkdirAll(etcDir, 0755); err != nil {
		t.Fatalf("mkdir etc: %v", err)
	}

	c := &ctx{
		plan: &Plan{
			Target:          target,
			Mode:            "replace",
			TargetPartition: "/dev/test_root",
			EspPartition:    "/dev/test_esp",
			HomePartition:   "/dev/test_home",
			FsType:          "ext4",
		},
		checks: &partitionChecks{
			filesystem: func(dev string) (filesystemInfo, error) {
				switch dev {
				case "/dev/test_root":
					return filesystemInfo{Type: "ext4", UUID: "root-uuid-1234"}, nil
				case "/dev/test_esp":
					return filesystemInfo{Type: "vfat", UUID: "esp-uuid-5678"}, nil
				case "/dev/test_home":
					return filesystemInfo{Type: "ext4", UUID: "home-uuid-9999"}, nil
				default:
					return filesystemInfo{}, nil
				}
			},
		},
		execute: func(input, name string, args ...string) error {
			return nil
		},
	}

	if err := runFstab(c); err != nil {
		t.Fatalf("runFstab failed: %v", err)
	}

	content, err := os.ReadFile(filepath.Join(etcDir, "fstab"))
	if err != nil {
		t.Fatalf("read fstab: %v", err)
	}
	fstabStr := string(content)

	if !strings.Contains(fstabStr, "UUID=root-uuid-1234 / ext4") {
		t.Errorf("fstab missing root entry: %s", fstabStr)
	}
	if !strings.Contains(fstabStr, "UUID=esp-uuid-5678 /boot/efi vfat defaults,umask=0077 0 2") {
		t.Errorf("fstab missing ESP entry: %s", fstabStr)
	}
	if !strings.Contains(fstabStr, "UUID=home-uuid-9999 /home ext4 defaults 0 2") {
		t.Errorf("fstab missing home entry: %s", fstabStr)
	}
}

func TestRunFstabBtrfsWithSeparateHome(t *testing.T) {
	target := t.TempDir()
	etcDir := filepath.Join(target, "etc")
	if err := os.MkdirAll(etcDir, 0755); err != nil {
		t.Fatalf("mkdir etc: %v", err)
	}

	c := &ctx{
		plan: &Plan{
			Target:          target,
			Mode:            "replace",
			TargetPartition: "/dev/test_root",
			EspPartition:    "/dev/test_esp",
			HomePartition:   "/dev/test_home",
			FsType:          "btrfs",
		},
		checks: &partitionChecks{
			filesystem: func(dev string) (filesystemInfo, error) {
				switch dev {
				case "/dev/test_root":
					return filesystemInfo{Type: "btrfs", UUID: "btrfs-root-uuid"}, nil
				case "/dev/test_esp":
					return filesystemInfo{Type: "vfat", UUID: "esp-uuid"}, nil
				case "/dev/test_home":
					return filesystemInfo{Type: "ext4", UUID: "home-uuid"}, nil
				default:
					return filesystemInfo{}, nil
				}
			},
		},
		execute: func(input, name string, args ...string) error {
			return nil
		},
	}

	if err := runFstab(c); err != nil {
		t.Fatalf("runFstab failed: %v", err)
	}

	content, err := os.ReadFile(filepath.Join(etcDir, "fstab"))
	if err != nil {
		t.Fatalf("read fstab: %v", err)
	}
	fstabStr := string(content)

	if strings.Contains(fstabStr, "subvol=/@home") {
		t.Errorf("fstab should not contain @home subvol when separate home partition is used:\n%s", fstabStr)
	}
	if !strings.Contains(fstabStr, "UUID=home-uuid /home ext4 defaults 0 2") {
		t.Errorf("fstab missing separate home partition entry:\n%s", fstabStr)
	}
}

func TestRunUsersPreservesExistingHome(t *testing.T) {
	target := t.TempDir()
	userHome := filepath.Join(target, "home", "artisan")
	if err := os.MkdirAll(userHome, 0755); err != nil {
		t.Fatalf("mkdir userHome: %v", err)
	}
	// Create an existing file in user's home
	myDoc := filepath.Join(userHome, "document.txt")
	if err := os.WriteFile(myDoc, []byte("my important data"), 0644); err != nil {
		t.Fatalf("write file: %v", err)
	}

	var chrootCommands [][]string
	c := &ctx{
		plan: &Plan{
			Target:   target,
			Login:    "artisan",
			Fullname: "Artisan User",
			UserPass: "evolution",
		},
		execute: func(input, name string, args ...string) error {
			if name == "chroot" {
				chrootCommands = append(chrootCommands, args)
			}
			return nil
		},
	}

	if err := runUsers(c); err != nil {
		t.Fatalf("runUsers failed: %v", err)
	}

	// Verify that useradd was called with -M (no skel copy, no create home)
	foundUseraddM := false
	foundChown := false
	for _, cmd := range chrootCommands {
		for i, arg := range cmd {
			if arg == "useradd" && i+1 < len(cmd) && cmd[i+1] == "-M" {
				foundUseraddM = true
			}
			if arg == "chown" {
				foundChown = true
			}
		}
	}
	if !foundUseraddM {
		t.Fatalf("expected useradd -M when home directory already exists, got commands: %+v", chrootCommands)
	}
	if !foundChown {
		t.Fatalf("expected chown -R on existing home directory, got commands: %+v", chrootCommands)
	}

	// Verify data is still intact
	data, err := os.ReadFile(myDoc)
	if err != nil || string(data) != "my important data" {
		t.Fatalf("user document was corrupted or lost: %v", err)
	}
}

func TestRunRemoveuserPreservesHomeWhenHomePartitionPresent(t *testing.T) {
	var chrootCommands [][]string
	c := &ctx{
		plan: &Plan{
			RemoveUser:    "live",
			HomePartition: "/dev/sda5",
		},
		execute: func(input, name string, args ...string) error {
			if name == "chroot" {
				chrootCommands = append(chrootCommands, args)
			}
			return nil
		},
	}

	if err := runRemoveuser(c); err != nil {
		t.Fatalf("runRemoveuser failed: %v", err)
	}

	for _, cmd := range chrootCommands {
		for _, arg := range cmd {
			if arg == "-r" {
				t.Fatalf("userdel should NOT use -r when HomePartition is present, got commands: %+v", chrootCommands)
			}
		}
	}
}
