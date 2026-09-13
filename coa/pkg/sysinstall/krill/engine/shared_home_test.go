package engine

import (
	"fmt"
	"strings"
	"testing"
)

func TestExternalHomeDiskBoundary(t *testing.T) {
	for _, tc := range []struct {
		ancestors, partition, disk string
		valid                      bool
	}{
		{"/dev/sdb1\n/dev/sdb\n", "/dev/sdb1", "/dev/sda", true},
		{"/dev/nvme0n1p2\n/dev/nvme0n1\n", "/dev/nvme0n1p2", "/dev/nvme0n1", false},
		{"/dev/sdb1\n/dev/sdb\n", "/dev/sdb1", "/dev/sdb", false},
		{"/dev/sdb1\n", "/dev/sdb1", "/dev/sda", false},
		{"", "/dev/sdb1", "/dev/sda", false},
		{"/dev/sdc1\n/dev/sdc\n", "/dev/sdb1", "/dev/sda", false},
	} {
		if err := validateExternalHomeDisk(tc.ancestors, tc.partition, tc.disk); (err == nil) != tc.valid {
			t.Fatalf("ancestors %q, disk %s: %v", tc.ancestors, tc.disk, err)
		}
	}
	// A directory can never be used in place of a block partition.
	if _, err := InspectExternalHomePartition(t.TempDir(), "/dev/sda"); err == nil {
		t.Fatal("accepted a directory as external HOME")
	}
}

func TestExternalHomeLayout(t *testing.T) {
	external := SharedHomePartition{Partition: "/dev/external1", UUID: "home-uuid", SizeBytes: 100 << 30}
	for _, sector := range []uint64{512, 4096} {
		minimum := CoexistESPBytes + 2*CoexistRootBytes + initMiB + (128*128/sector+1)*sector
		if _, err := CalculateCoexistLayoutWithHome("/dev/test", minimum-sector, sector, CoexistRootBytes, external); err == nil {
			t.Fatal("accepted external HOME layout one sector below minimum")
		}
		for _, bytes := range []uint64{minimum, 21 << 30, 22 << 30, 32 << 30, 2048 << 30} {
			l, err := CalculateCoexistLayoutWithHome("/dev/test", bytes, sector, CoexistRootBytes, external)
			if err != nil {
				t.Fatal(err)
			}
			if l.ExternalHome != external || len(l.Partitions) < 3 {
				t.Fatal("lost external HOME or root slots")
			}
			for n, p := range l.Partitions[1:] {
				if p.Label != fmt.Sprintf("root%d", n+1) || p.Sectors*sector != CoexistRootBytes || p.Device == external.Partition {
					t.Fatalf("unexpected root or HOME partition: %+v", p)
				}
			}
			last := l.Partitions[len(l.Partitions)-1]
			end := bytes/sector - (uint64(l.TableEntries)*128+sector-1)/sector - 1
			if last.Start+last.Sectors > end || (end-last.Start-last.Sectors)*sector >= CoexistRootBytes {
				t.Fatal("layout overlaps backup GPT or wastes a whole root slot")
			}
		}
	}
}

func TestExternalHomePreparationPreservesPartition(t *testing.T) {
	external := SharedHomePartition{Partition: "/dev/external1", UUID: "home-uuid", SizeBytes: 100 << 30}
	l, err := CalculateCoexistLayoutWithHome("/dev/test", 22<<30, 512, CoexistRootBytes, external)
	if err != nil {
		t.Fatal(err)
	}
	c, commands := testContext(t, &Plan{Device: l.Device})
	if err := initializeCoexistDisk(c, l, l.Device, func(string, string, uint64) (CoexistDiskLayout, error) { return l, nil }); err != nil {
		t.Fatal(err)
	}
	for _, command := range *commands {
		if strings.Contains(command, external.Partition) || strings.Contains(command, "SHARED_HOMES") || strings.Contains(command, "/dev/test4") {
			t.Fatalf("prepared or formatted an unrequested partition: %s", command)
		}
	}
	if !strings.Contains(strings.Join(*commands, "\n"), "mkfs.ext4 -F -L root2 /dev/test3") {
		t.Fatal("did not prepare both root slots")
	}
	for _, mutate := range []func(*CoexistDiskLayout){
		func(l *CoexistDiskLayout) { l.ExternalHome.UUID = "other-home" },
		func(l *CoexistDiskLayout) { l.ExternalHome.Partition = "/dev/other1" },
		func(l *CoexistDiskLayout) { l.ExternalHome.SizeBytes++ },
		func(l *CoexistDiskLayout) { l.ExternalHome = SharedHomePartition{} },
	} {
		*commands = nil
		err := initializeCoexistDisk(c, l, l.Device, func(string, string, uint64) (CoexistDiskLayout, error) {
			fresh := l
			mutate(&fresh)
			return fresh, nil
		})
		if err == nil || len(*commands) != 0 {
			t.Fatal("changed external HOME allowed a disk write")
		}
	}
}
