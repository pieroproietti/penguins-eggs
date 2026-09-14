package engine

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"strings"

	"coa/pkg/distro"
	"coa/pkg/utils"
)

const (
	initMiB             = uint64(1024 * 1024)
	CoexistESPBytes     = 512 * initMiB
	CoexistRootBytes    = 10 * 1024 * initMiB
	CoexistMinRootBytes = 4 * 1024 * initMiB
	CoexistMinHomeBytes = 10 * 1024 * initMiB
	espGUID             = "C12A7328-F81F-11D2-BA4B-00A0C93EC93B"
	linuxGUID           = "0FC63DAF-8483-4772-8E79-3D69D8477DE4"
)

// CoexistDiskLayout is a preview of disk preparation, not an installation Plan.
type CoexistDiskLayout struct {
	Device                string
	DiskBytes, SectorSize uint64
	RootBytes             uint64 // transient initializer parameter
	ExternalHome          SharedHomePartition
	HomeOnRoot            bool
	TableEntries          int
	Partitions            []CoexistDiskPartition
	liveDevice, identity  string
}

type CoexistDiskPartition struct {
	Device, Label, Filesystem, Type string
	Start, Sectors                  uint64
}

func CalculateCoexistLayout(device string, bytes, sector, rootBytes uint64) (CoexistDiskLayout, error) {
	return CalculateCoexistLayoutWithHome(device, bytes, sector, rootBytes, SharedHomePartition{})
}

// External HOME leaves only ESP and fixed-size ROOT slots on the prepared disk.
func CalculateCoexistLayoutWithHome(device string, bytes, sector, rootBytes uint64, external SharedHomePartition) (CoexistDiskLayout, error) {
	return calculateCoexistLayout(device, bytes, sector, rootBytes, external, false)
}

func CalculateCoexistLayoutWithoutHome(device string, bytes, sector, rootBytes uint64) (CoexistDiskLayout, error) {
	return calculateCoexistLayout(device, bytes, sector, rootBytes, SharedHomePartition{}, true)
}

func calculateCoexistLayout(device string, bytes, sector, rootBytes uint64, external SharedHomePartition, homeOnRoot bool) (CoexistDiskLayout, error) {
	l := CoexistDiskLayout{Device: device, DiskBytes: bytes, SectorSize: sector, RootBytes: rootBytes, ExternalHome: external, HomeOnRoot: homeOnRoot}
	minHome, extraParts := CoexistMinHomeBytes, uint64(2)
	if external.Partition != "" || homeOnRoot {
		minHome, extraParts = 0, 1
	}
	if device == "" || (sector != 512 && sector != 4096) || bytes%sector != 0 || bytes < CoexistESPBytes+minHome {
		return l, fmt.Errorf("invalid disk geometry for UEFI/GPT Coexist initialization")
	}
	if rootBytes < CoexistMinRootBytes || rootBytes%(1024*initMiB) != 0 {
		return l, fmt.Errorf("root slot size must be a whole number of GiB, at least 4 GiB")
	}
	slots := (bytes - CoexistESPBytes - minHome) / rootBytes
	// GPT entry arrays grow for disks needing more than the usual 128 entries.
	for ; slots >= 2; slots-- {
		entries := ((slots + extraParts + 127) / 128) * 128
		arraySectors := (entries*128 + sector - 1) / sector
		start := ((2+arraySectors)*sector + initMiB - 1) / initMiB * (initMiB / sector)
		end := bytes/sector - arraySectors - 1 // exclusive; preserve backup GPT
		homeStart := start + (CoexistESPBytes+slots*rootBytes)/sector
		if homeStart > end || (end-homeStart)*sector < minHome {
			continue
		}
		l.TableEntries = int(entries)
		for n := uint64(0); n < slots+extraParts; n++ {
			p := CoexistDiskPartition{Device: devPart(device, int(n+1)), Label: fmt.Sprintf("root%d", n), Filesystem: "ext4", Type: linuxGUID, Start: start, Sectors: rootBytes / sector}
			if n == 0 {
				p.Label, p.Filesystem, p.Type, p.Sectors = "ESP", "vfat", espGUID, CoexistESPBytes/sector
			} else if n == slots+1 {
				p.Label, p.Sectors = SharedHomeLabel, end-start
			}
			l.Partitions = append(l.Partitions, p)
			start += p.Sectors
		}
		return l, nil
	}
	return l, fmt.Errorf("disk too small: need a 512 MiB ESP, at least two %d GiB roots, %d GiB local HOME and GPT alignment space", rootBytes/(1024*initMiB), minHome/(1024*initMiB))
}

func (l CoexistDiskLayout) partitionScript() string {
	lines := []string{"label: gpt", "unit: sectors", fmt.Sprintf("table-length: %d", l.TableEntries)}
	for _, p := range l.Partitions {
		// Explicit HOME size is the calculated remainder. Omitting it makes
		// sfdisk round down to MiB, potentially violating the minimum HOME size.
		lines = append(lines, fmt.Sprintf("start=%d, size=%d, type=%s", p.Start, p.Sectors, p.Type))
	}
	return strings.Join(lines, "\n") + "\n"
}

type initializationDisk struct {
	Path     string               `json:"path"`
	Type     string               `json:"type"`
	Size     uint64               `json:"size"`
	Sector   uint64               `json:"log-sec"`
	ReadOnly bool                 `json:"ro"`
	ID       string               `json:"maj:min"`
	Serial   string               `json:"serial"`
	WWN      string               `json:"wwn"`
	Mounts   []string             `json:"mountpoints"`
	Children []initializationDisk `json:"children"`
}

func checkInitializationDisk(d initializationDisk, liveDevice string) error {
	if d.Path == liveDevice {
		return fmt.Errorf("refusing the live boot device %s", liveDevice)
	}
	if d.ReadOnly || (d.Type != "disk" && d.Type != "part") {
		return fmt.Errorf("device %s is read-only or in use by %s", d.Path, d.Type)
	}
	for _, mount := range d.Mounts {
		if mount != "" {
			return fmt.Errorf("device %s is mounted/in use at %s", d.Path, mount)
		}
	}
	for _, child := range d.Children {
		if err := checkInitializationDisk(child, liveDevice); err != nil {
			return err
		}
	}
	return nil
}

// Probe the kernel's whole-disk tree, including swap, mapped devices and holders.
// Discovery errors are fatal here; the more permissive TUI discovery is not a
// sufficient authorization for a whole-disk wipe.
func PreviewCoexistDisk(device, liveDevice string, rootBytes uint64) (CoexistDiskLayout, error) {
	return PreviewCoexistDiskWithHome(device, liveDevice, rootBytes, "")
}

func PreviewCoexistDiskWithHome(device, liveDevice string, rootBytes uint64, destination string) (CoexistDiskLayout, error) {
	return previewCoexistDisk(device, liveDevice, rootBytes, destination, false)
}

func PreviewCoexistDiskWithoutHome(device, liveDevice string, rootBytes uint64) (CoexistDiskLayout, error) {
	return previewCoexistDisk(device, liveDevice, rootBytes, "", true)
}

func previewCoexistDisk(device, liveDevice string, rootBytes uint64, destination string, homeOnRoot bool) (CoexistDiskLayout, error) {
	shared, err := DetectSharedHome()
	if err != nil {
		return CoexistDiskLayout{}, err
	}
	if !homeOnRoot && destination == "" && shared != "" {
		return CoexistDiskLayout{}, fmt.Errorf("%s already exists on %s; choose HOME on ROOT or reuse the existing shared partition", SharedHomeLabel, shared)
	}
	if err := ValidateCoexistFamily(distro.NewDistro().FamilyID); err != nil {
		return CoexistDiskLayout{}, err
	}
	if !IsUEFI() {
		return CoexistDiskLayout{}, fmt.Errorf("Coexist disk initialization requires UEFI")
	}
	device, err = filepath.EvalSymlinks(device)
	if err != nil {
		return CoexistDiskLayout{}, err
	}
	if liveDevice != "" {
		liveDevice, err = filepath.EvalSymlinks(liveDevice)
		if err != nil {
			return CoexistDiskLayout{}, fmt.Errorf("cannot verify live boot device: %w", err)
		}
	}
	out, err := utils.ExecCapture("lsblk --bytes --json --tree --output PATH,TYPE,SIZE,LOG-SEC,RO,MAJ:MIN,SERIAL,WWN,MOUNTPOINTS " + shellQuote(device))
	if err != nil {
		return CoexistDiskLayout{}, err
	}
	var tree struct {
		Devices []initializationDisk `json:"blockdevices"`
	}
	if err := json.Unmarshal([]byte(out), &tree); err != nil {
		return CoexistDiskLayout{}, err
	}
	if len(tree.Devices) != 1 || tree.Devices[0].Type != "disk" || tree.Devices[0].Path != device {
		return CoexistDiskLayout{}, fmt.Errorf("select a single whole disk")
	}
	d := tree.Devices[0]
	if err := checkInitializationDisk(d, liveDevice); err != nil {
		return CoexistDiskLayout{}, err
	}
	var checkHolders func(initializationDisk) error
	checkHolders = func(node initializationDisk) error {
		holders, err := os.ReadDir(filepath.Join("/sys/dev/block", node.ID, "holders"))
		if err != nil {
			return err
		}
		if len(holders) != 0 {
			return fmt.Errorf("device %s has active holders", node.Path)
		}
		for _, child := range node.Children {
			if err := checkHolders(child); err != nil {
				return err
			}
		}
		return nil
	}
	if err := checkHolders(d); err != nil {
		return CoexistDiskLayout{}, err
	}
	var external SharedHomePartition
	if destination != "" {
		external, err = InspectExternalHomePartition(destination, device)
		if err != nil {
			return CoexistDiskLayout{}, err
		}
	}
	if destination != "" && external.Partition != shared {
		return CoexistDiskLayout{}, fmt.Errorf("external HOME must be the unique %s partition", SharedHomeLabel)
	}
	l, err := calculateCoexistLayout(device, d.Size, d.Sector, rootBytes, external, homeOnRoot)
	l.liveDevice, l.identity = liveDevice, d.ID+"/"+d.Serial+"/"+d.WWN
	return l, err
}

func InitializeCoexistDisk(proposed CoexistDiskLayout, confirmation string) error {
	log, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0600)
	if err != nil {
		return err
	}
	defer log.Close()
	c := &ctx{plan: &Plan{Device: proposed.Device, Mode: "erase", TableType: "gpt"}, log: log}
	return initializeCoexistDisk(c, proposed, confirmation, func(device, liveDevice string, rootBytes uint64) (CoexistDiskLayout, error) {
		return previewCoexistDisk(device, liveDevice, rootBytes, proposed.ExternalHome.Partition, proposed.HomeOnRoot)
	})
}

func initializeCoexistDisk(c *ctx, proposed CoexistDiskLayout, confirmation string, preview func(string, string, uint64) (CoexistDiskLayout, error)) error {
	if confirmation != proposed.Device || confirmation == "" {
		return fmt.Errorf("type the exact disk path to confirm destructive initialization")
	}
	fresh, err := preview(proposed.Device, proposed.liveDevice, proposed.RootBytes)
	if err != nil {
		return err
	}
	if !reflect.DeepEqual(proposed, fresh) || c.plan.Device != proposed.Device {
		return fmt.Errorf("disk or proposed layout changed; review a new preview")
	}
	if err := c.writePartitionTable(proposed.partitionScript()); err != nil {
		return err
	}
	for _, p := range proposed.Partitions {
		fs, label := p.Filesystem, p.Label
		if fs == "vfat" {
			fs, label = "fat", ""
		}
		if err := c.formatPartition(p.Device, fs, label); err != nil {
			return err
		}
	}
	return c.run("udevadm", "settle")
}
