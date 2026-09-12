package engine

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"reflect"
	"strings"
	"testing"

	"coa/pkg/utils"
)

func TestCalculateCoexistLayout(t *testing.T) {
	for _, tc := range []struct {
		gib   uint64
		slots int
	}{{33, 2}, {40, 2}, {64, 5}, {128, 13}, {256, 29}, {2048, 253}} {
		for _, sector := range []uint64{512, 4096} {
			l, err := CalculateCoexistLayout("/dev/nvme0n1", tc.gib<<30, sector)
			if err != nil {
				t.Fatal(err)
			}
			if len(l.Partitions) != tc.slots+2 {
				t.Fatalf("%d GiB: got %d root slots", tc.gib, len(l.Partitions)-2)
			}
			esp, home := l.Partitions[0], l.Partitions[len(l.Partitions)-1]
			if esp.Device != "/dev/nvme0n1p1" || esp.Type != espGUID || esp.Sectors*sector != CoexistESPBytes || esp.Filesystem != "vfat" {
				t.Fatalf("ESP: %+v", esp)
			}
			if home.Sectors*sector < CoexistMinHomeBytes || home.Sectors*sector >= CoexistMinHomeBytes+CoexistRootBytes {
				t.Fatalf("HOME/minimum/maximum slots: %+v", home)
			}
			arraySectors := (uint64(l.TableEntries)*128 + sector - 1) / sector
			if home.Start+home.Sectors != l.DiskBytes/sector-arraySectors-1 {
				t.Fatal("HOME does not consume remainder")
			}
			for n, p := range l.Partitions[1 : len(l.Partitions)-1] {
				if p.Sectors*sector != CoexistRootBytes || p.Filesystem != "ext4" || p.Start != l.Partitions[n].Start+l.Partitions[n].Sectors || p.Start*sector%(1<<20) != 0 {
					t.Fatalf("root: %+v", p)
				}
			}
			lines := strings.Split(strings.TrimSpace(l.partitionScript()), "\n")
			if !strings.Contains(lines[len(lines)-1], fmt.Sprintf("size=%d", home.Sectors)) || !strings.Contains(l.partitionScript(), "type="+espGUID) {
				t.Fatal("sfdisk does not preserve EFI type or remainder")
			}
		}
	}
	minimum := CoexistESPBytes + 2*CoexistRootBytes + CoexistMinHomeBytes + initMiB + 33*512
	for _, bytes := range []uint64{0, 16 << 30, 32 << 30, minimum - 512} {
		if _, err := CalculateCoexistLayout("/dev/test", bytes, 512); err == nil {
			t.Fatalf("accepted insufficient %d bytes", bytes)
		}
	}
	if _, err := CalculateCoexistLayout("/dev/test", minimum, 512); err != nil {
		t.Fatal(err)
	}
}

func TestInitializationSafety(t *testing.T) {
	if !IsUEFI() {
		if _, err := PreviewCoexistDisk("/dev/test", ""); err == nil || !strings.Contains(err.Error(), "requires UEFI") {
			t.Fatal("BIOS initialization was not refused before disk probing")
		}
	}
	disk := initializationDisk{Path: "/dev/test", Type: "disk", Children: []initializationDisk{{Path: "/dev/test1", Type: "part"}}}
	if err := checkInitializationDisk(disk, "/dev/live"); err != nil {
		t.Fatal(err)
	}
	for _, live := range []string{"/dev/test", "/dev/test1"} {
		if err := checkInitializationDisk(disk, live); err == nil {
			t.Fatal("accepted live device")
		}
	}
	for _, mount := range []string{"/run/live/medium", "/home", "[SWAP]"} {
		disk.Children[0].Mounts = []string{mount}
		if err := checkInitializationDisk(disk, ""); err == nil {
			t.Fatal("accepted mounted/swap partition")
		}
	}
	disk.Children[0].Mounts = nil
	disk.Children[0].Children = []initializationDisk{{Path: "/dev/dm-0", Type: "crypt"}}
	if err := checkInitializationDisk(disk, ""); err == nil {
		t.Fatal("accepted active mapped device")
	}
	disk.Children = nil
	disk.ReadOnly = true
	if err := checkInitializationDisk(disk, ""); err == nil {
		t.Fatal("accepted read-only disk")
	}
}

func TestInitializationDispatchAndFailures(t *testing.T) {
	l, err := CalculateCoexistLayout("/dev/test", 40<<30, 512)
	if err != nil {
		t.Fatal(err)
	}
	var want []string
	want = append(want, "wipefs -a /dev/test", "sfdisk --wipe always /dev/test", "udevadm settle", "wipefs -a /dev/test1", "mkfs.fat -F32 /dev/test1", "wipefs -a /dev/test2", "mkfs.ext4 -F -L root1 /dev/test2", "wipefs -a /dev/test3", "mkfs.ext4 -F -L root2 /dev/test3", "wipefs -a /dev/test4", "mkfs.ext4 -F -L SHARED_HOMES /dev/test4", "udevadm settle")
	for failAt := -1; failAt < len(want); failAt++ {
		c, _ := testContext(t, &Plan{Device: l.Device})
		var commands []string
		c.execute = func(input, name string, args ...string) error {
			commands = append(commands, strings.Join(append([]string{name}, args...), " "))
			if name == "sfdisk" && input != l.partitionScript() {
				t.Fatal("wrong sfdisk layout")
			}
			if len(commands)-1 == failAt {
				return errors.New("injected failure")
			}
			return nil
		}
		preview := func(string, string) (CoexistDiskLayout, error) { return l, nil }
		if err := initializeCoexistDisk(c, l, "yes", preview); err == nil || len(commands) != 0 {
			t.Fatal("unconfirmed wipe")
		}
		err := initializeCoexistDisk(c, l, l.Device, preview)
		if failAt < 0 {
			if err != nil || !reflect.DeepEqual(commands, want) {
				t.Fatalf("%v: %q", err, commands)
			}
		} else if err == nil || !reflect.DeepEqual(commands, want[:failAt+1]) {
			t.Fatalf("continued after failure %d: %v %q", failAt, err, commands)
		}
	}
	c, _ := testContext(t, &Plan{Device: l.Device})
	c.execute = func(string, string, ...string) error { t.Fatal("wrote after failed recheck"); return nil }
	for _, probeErr := range []error{nil, errors.New("disk now in use")} {
		err := initializeCoexistDisk(c, l, l.Device, func(string, string) (CoexistDiskLayout, error) {
			changed := l
			changed.identity = "different disk"
			return changed, probeErr
		})
		if err == nil {
			t.Fatal("ignored changed disk or failed probe")
		}
	}
}

// Exercise the same sfdisk input on a sparse regular file, never a real disk.
func TestCoexistSfdiskLayout(t *testing.T) {
	sfdisk, err := exec.LookPath("sfdisk")
	if err != nil {
		sfdisk = "/usr/sbin/sfdisk"
		if _, err := os.Stat(sfdisk); err != nil {
			t.Skip("sfdisk unavailable")
		}
	}
	for _, bytes := range []uint64{64 << 30, 2048 << 30} {
		file, err := os.CreateTemp(t.TempDir(), "disk.img")
		if err != nil {
			t.Fatal(err)
		}
		if err := file.Truncate(int64(bytes)); err != nil {
			t.Fatal(err)
		}
		if err := file.Close(); err != nil {
			t.Fatal(err)
		}
		l, err := CalculateCoexistLayout(file.Name(), bytes, 512)
		if err != nil {
			t.Fatal(err)
		}
		if out, err := utils.ExecCaptureCombined("printf %s " + shellQuote(l.partitionScript()) + " | " + shellQuote(sfdisk) + " --wipe always " + shellQuote(file.Name())); err != nil {
			t.Fatalf("sfdisk: %v: %s", err, out)
		}
		out, err := utils.ExecCapture(shellQuote(sfdisk) + " --json " + shellQuote(file.Name()))
		if err != nil {
			t.Fatal(err)
		}
		var actual struct {
			Table struct {
				Label      string
				Partitions []struct {
					Start, Size uint64
					Type        string
				}
			} `json:"partitiontable"`
		}
		if err := json.Unmarshal([]byte(out), &actual); err != nil {
			t.Fatal(err)
		}
		if actual.Table.Label != "gpt" || len(actual.Table.Partitions) != len(l.Partitions) {
			t.Fatal("wrong GPT table")
		}
		for n, p := range actual.Table.Partitions {
			want := l.Partitions[n]
			if p.Start != want.Start || p.Size != want.Sectors || !strings.EqualFold(p.Type, want.Type) {
				t.Fatalf("partition %d: got %+v, want %+v", n, p, want)
			}
		}
	}
}
