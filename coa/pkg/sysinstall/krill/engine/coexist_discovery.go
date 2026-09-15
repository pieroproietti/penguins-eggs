package engine

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"regexp"
	"strings"

	"coa/pkg/utils"
)

var (
	genericRootPattern = regexp.MustCompile(`^root\d+$`)
	coexistCoePattern  = regexp.MustCompile(`^coe-?\d*$`)
	coexistPartPattern = regexp.MustCompile(`^[a-z0-9]+-[a-z0-9_-]+$`)
)

// FindHostRootDisk returns the disk device containing the host root filesystem (e.g. /dev/sdb).
func FindHostRootDisk() string {
	out, err := utils.ExecCapture("findmnt -n -o SOURCE /")
	if err != nil {
		return ""
	}
	dev := strings.TrimSpace(out)
	if dev == "" {
		return ""
	}
	pk, err := utils.ExecCapture("lsblk -dno PKNAME " + shellQuote(dev))
	if err == nil && strings.TrimSpace(pk) != "" {
		return "/dev/" + strings.TrimSpace(pk)
	}
	return ""
}

type CoexistSlotReport struct {
	Device     string `json:"device"`
	Name       string `json:"name"`
	Size       uint64 `json:"size"`
	SizeHuman  string `json:"size_human"`
	FsType     string `json:"fstype"`
	Label      string `json:"label"`
	PartLabel  string `json:"partlabel"`
	UUID       string `json:"uuid"`
	MountPoint string `json:"mountpoint"`
	IsFree     bool   `json:"is_free"`
	SystemID   string `json:"system_id"`
}

type CoexistDiskReport struct {
	Device    string              `json:"device"`
	Name      string              `json:"name"`
	Size      uint64              `json:"size"`
	SizeHuman string              `json:"size_human"`
	EspDevice string              `json:"esp_device"`
	EspSize   string              `json:"esp_size"`
	Slots     []CoexistSlotReport `json:"slots"`
}

type lsblkDeviceDiscovery struct {
	Path        string                 `json:"path"`
	Name        string                 `json:"name"`
	Size        uint64                 `json:"size"`
	Type        string                 `json:"type"`
	FsType      string                 `json:"fstype"`
	Label       string                 `json:"label"`
	PartLabel   string                 `json:"partlabel"`
	PartType    string                 `json:"parttype"`
	PtType      string                 `json:"pttype"`
	UUID        string                 `json:"uuid"`
	Mountpoints []string               `json:"mountpoints"`
	Children    []lsblkDeviceDiscovery `json:"children"`
}

type lsblkTreeDiscovery struct {
	BlockDevices []lsblkDeviceDiscovery `json:"blockdevices"`
}

func formatBytesHuman(bytes uint64) string {
	const (
		kib = 1024
		mib = kib * 1024
		gib = mib * 1024
		tib = gib * 1024
	)
	switch {
	case bytes >= tib:
		return fmt.Sprintf("%.1f TiB", float64(bytes)/float64(tib))
	case bytes >= gib:
		return fmt.Sprintf("%.1f GiB", float64(bytes)/float64(gib))
	case bytes >= mib:
		return fmt.Sprintf("%.1f MiB", float64(bytes)/float64(mib))
	default:
		return fmt.Sprintf("%d B", bytes)
	}
}

// GenerateSlotSystemID creates a standardized '<partName>-<distro>' System Name (ID)
// limited to 16 characters for ext4 label compatibility.
func GenerateSlotSystemID(partDevice, distroID string) string {
	partName := strings.ToLower(filepath.Base(partDevice))
	dist := strings.ToLower(distroID)
	if dist == "" {
		dist = "linux"
	}
	id := fmt.Sprintf("%s-%s", partName, dist)
	if len(id) > 16 {
		id = id[:16]
		id = strings.TrimRight(id, "-")
	}
	return id
}

// IsCoexistSignature checks if a partition's PARTLABEL or LABEL matches Coexist conventions.
func IsCoexistSignature(partLabel, label string) bool {
	pLower := strings.ToLower(partLabel)
	if strings.HasPrefix(pLower, "coexist") {
		return true
	}
	lLower := strings.ToLower(label)
	if genericRootPattern.MatchString(lLower) || lLower == "root" {
		return true
	}
	if coexistCoePattern.MatchString(lLower) {
		return true
	}
	if coexistPartPattern.MatchString(lLower) {
		return true
	}
	return false
}

// DetectCoexistDisks inspects the block devices and returns all disks that match
// the Coexist multi-boot specification.
func DetectCoexistDisks() []CoexistDiskReport {
	out, err := utils.ExecCapture("lsblk --bytes --json --tree --output PATH,NAME,SIZE,TYPE,FSTYPE,LABEL,PARTLABEL,PARTTYPE,MOUNTPOINTS,PTTYPE,UUID,PARTUUID")
	if err != nil {
		return nil
	}
	return parseCoexistDisks(out)
}

func parseCoexistDisks(jsonOut string) []CoexistDiskReport {
	var tree lsblkTreeDiscovery
	if err := json.Unmarshal([]byte(jsonOut), &tree); err != nil {
		return nil
	}

	var reports []CoexistDiskReport
	for _, disk := range tree.BlockDevices {
		if disk.Type != "disk" || disk.PtType != "gpt" || len(disk.Children) < 3 {
			continue
		}

		var espDev lsblkDeviceDiscovery
		var slots []lsblkDeviceDiscovery
		hasEsp := false
		hasCoexistSig := false

		for _, child := range disk.Children {
			if child.Type != "part" {
				continue
			}

			// Check if ESP
			isEspPart := strings.EqualFold(child.PartType, espGUID) ||
				strings.EqualFold(child.PartType, "c12a7328-f81f-11d2-ba4b-00a0c93ec93b") ||
				strings.EqualFold(child.PartType, "0xef") ||
				strings.EqualFold(child.PartType, "ef") ||
				(child.FsType == "vfat" && (strings.EqualFold(child.PartLabel, "esp") || strings.EqualFold(child.Label, "esp")))

			if isEspPart && !hasEsp {
				hasEsp = true
				espDev = child
				continue
			}

			// Check if candidate root slot
			if child.FsType != "swap" && !strings.EqualFold(child.PartType, espGUID) {
				slots = append(slots, child)
				if IsCoexistSignature(child.PartLabel, child.Label) {
					hasCoexistSig = true
				}
			}
		}

		// Must have 1 ESP, at least 2 slots, and at least one coexist signature
		if hasEsp && len(slots) >= 2 && hasCoexistSig {
			rep := CoexistDiskReport{
				Device:    disk.Path,
				Name:      disk.Name,
				Size:      disk.Size,
				SizeHuman: formatBytesHuman(disk.Size),
				EspDevice: espDev.Path,
				EspSize:   formatBytesHuman(espDev.Size),
			}

			for _, s := range slots {
				mount := ""
				for _, m := range s.Mountpoints {
					if m != "" {
						mount = m
						break
					}
				}

				isFree := false
				sysID := ""
				lbl := strings.TrimSpace(s.Label)
				if lbl == "" || genericRootPattern.MatchString(lbl) || lbl == "root" || coexistCoePattern.MatchString(lbl) {
					isFree = (mount == "")
				} else {
					sysID = lbl
				}

				rep.Slots = append(rep.Slots, CoexistSlotReport{
					Device:     s.Path,
					Name:       s.Name,
					Size:       s.Size,
					SizeHuman:  formatBytesHuman(s.Size),
					FsType:     s.FsType,
					Label:      s.Label,
					PartLabel:  s.PartLabel,
					UUID:       s.UUID,
					MountPoint: mount,
					IsFree:     isFree,
					SystemID:   sysID,
				})
			}

			reports = append(reports, rep)
		}
	}

	return reports
}

// GetCoexistDiskReport returns the Coexist report for a specific disk device.
func GetCoexistDiskReport(device string) (*CoexistDiskReport, error) {
	evalDevice, err := filepath.EvalSymlinks(device)
	if err == nil {
		device = evalDevice
	}
	disks := DetectCoexistDisks()
	for _, d := range disks {
		if d.Device == device {
			return &d, nil
		}
	}
	return nil, fmt.Errorf("device %s is not a Coexist disk", device)
}

// IsCoexistDisk checks if a given disk path is an initialized Coexist disk.
func IsCoexistDisk(device string) bool {
	_, err := GetCoexistDiskReport(device)
	return err == nil
}
