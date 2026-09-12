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
		gib, rootGiB uint64
		slots        int
	}{{33, 8, 2}, {40, 8, 2}, {64, 8, 5}, {128, 8, 13}, {256, 8, 29}, {2048, 8, 253},
		{64, 16, 2}, {128, 16, 6}, {256, 16, 14}, {2048, 16, 126}, {4096, 16, 254}, {25, 4, 2}, {64, 4, 11}} {
		for _, sector := range []uint64{512, 4096} {
			l, err := CalculateCoexistLayout("/dev/nvme0n1", tc.gib<<30, sector, tc.rootGiB<<30)
			if err != nil {
				t.Fatal(err)
			}
			if len(l.Partitions) != tc.slots+2 || l.RootBytes != tc.rootGiB<<30 {
				t.Fatalf("%d GiB: got %d root slots", tc.gib, len(l.Partitions)-2)
			}
			esp, home := l.Partitions[0], l.Partitions[len(l.Partitions)-1]
			if esp.Device != "/dev/nvme0n1p1" || esp.Type != espGUID || esp.Sectors*sector != CoexistESPBytes || esp.Filesystem != "vfat" {
				t.Fatalf("ESP: %+v", esp)
			}
			if home.Sectors*sector < CoexistMinHomeBytes || home.Sectors*sector >= CoexistMinHomeBytes+(tc.rootGiB<<30) {
				t.Fatalf("HOME/minimum/maximum slots: %+v", home)
			}
			arraySectors := (uint64(l.TableEntries)*128 + sector - 1) / sector
			if home.Start+home.Sectors != l.DiskBytes/sector-arraySectors-1 {
				t.Fatal("HOME does not consume remainder")
			}
			for n, p := range l.Partitions[1 : len(l.Partitions)-1] {
				if p.Sectors*sector != tc.rootGiB<<30 || p.Filesystem != "ext4" || p.Start != l.Partitions[n].Start+l.Partitions[n].Sectors || p.Start*sector%(1<<20) != 0 {
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
		if _, err := CalculateCoexistLayout("/dev/test", bytes, 512, CoexistRootBytes); err == nil {
			t.Fatalf("accepted insufficient %d bytes", bytes)
		}
	}
	if _, err := CalculateCoexistLayout("/dev/test", minimum, 512, CoexistRootBytes); err != nil {
		t.Fatal(err)
	}
}

func TestInitializationSafety(t *testing.T) {
	if !IsUEFI() {
		if _, err := PreviewCoexistDisk("/dev/test", "", CoexistRootBytes); err == nil || !strings.Contains(err.Error(), "requires UEFI") {
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
	l, err := CalculateCoexistLayout("/dev/test", 40<<30, 512, CoexistRootBytes)
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
		preview := func(string, string, uint64) (CoexistDiskLayout, error) { return l, nil }
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
		err := initializeCoexistDisk(c, l, l.Device, func(string, string, uint64) (CoexistDiskLayout, error) {
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
	for _, tc := range []struct{ bytes, rootBytes uint64 }{{64 << 30, CoexistRootBytes}, {2048 << 30, CoexistRootBytes}, {64 << 30, 16 << 30}} {
		bytes := tc.bytes
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
		l, err := CalculateCoexistLayout(file.Name(), bytes, 512, tc.rootBytes)
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

func TestCoexistRootSizeBoundaries(t *testing.T) {
	if CoexistRootBytes != 8<<30 {
		t.Fatal("default root size changed")
	}
	for _, rootBytes := range []uint64{4 << 30, 8 << 30, 16 << 30} {
		for _, sector := range []uint64{512, 4096} {
			backupBytes := (128*128/sector + 1) * sector
			minimum := CoexistESPBytes + 2*rootBytes + CoexistMinHomeBytes + initMiB + backupBytes
			if _, err := CalculateCoexistLayout("/dev/test", minimum-sector, sector, rootBytes); err == nil {
				t.Fatalf("accepted disk one sector below minimum: root %d, sector %d", rootBytes, sector)
			}
			l, err := CalculateCoexistLayout("/dev/test", minimum, sector, rootBytes)
			if err != nil || len(l.Partitions) != 4 || l.Partitions[3].Sectors*sector != CoexistMinHomeBytes {
				t.Fatalf("exact minimum: %+v, %v", l, err)
			}
		}
	}
	for _, rootBytes := range []uint64{0, 1, 3 << 30, (4 << 30) - 1, (4 << 30) + 512, 24 << 30, 64 << 30, 1 << 63, ^uint64(0)} {
		if _, err := CalculateCoexistLayout("/dev/test", 64<<30, 512, rootBytes); err == nil {
			t.Fatalf("accepted invalid or oversized root size: %d", rootBytes)
		}
	}
	if l, err := CalculateCoexistLayout("/dev/test", 64<<30, 512, 23<<30); err != nil || len(l.Partitions) != 4 {
		t.Fatalf("largest whole-GiB roots on 64 GiB disk rejected: %+v, %v", l, err)
	}
}

func TestInitializationRechecksSelectedRootSize(t *testing.T) {
	l, err := CalculateCoexistLayout("/dev/test", 64<<30, 512, 16<<30)
	if err != nil {
		t.Fatal(err)
	}
	l.liveDevice, l.identity = "/dev/live", "same disk"
	c, commands := testContext(t, &Plan{Device: l.Device})
	preview := func(device, liveDevice string, rootBytes uint64) (CoexistDiskLayout, error) {
		if device != l.Device || liveDevice != l.liveDevice || rootBytes != 16<<30 {
			t.Fatal("selected size or disk safety context lost during recheck")
		}
		fresh, err := CalculateCoexistLayout(device, l.DiskBytes, l.SectorSize, rootBytes)
		fresh.liveDevice, fresh.identity = l.liveDevice, l.identity
		return fresh, err
	}
	if err := initializeCoexistDisk(c, l, l.Device, preview); err != nil || len(*commands) == 0 {
		t.Fatalf("selected layout did not reach partitioning: %v", err)
	}
	*commands = nil
	// A layout that does not match its size parameter must still be refused.
	l.Partitions[1].Sectors++
	if err := initializeCoexistDisk(c, l, l.Device, preview); err == nil || len(*commands) != 0 {
		t.Fatal("altered layout bypassed recheck")
	}
}
