package krill

import (
	"encoding/json"
	"fmt"
	"strings"

	"coa/pkg/sysinstall/krill/engine"
	"coa/pkg/utils"

	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
)

type coexistInitialization struct {
	layout         engine.CoexistDiskLayout
	view           viewport.Model
	confirmation   string
	busy, reviewed bool
}

type coexistPreviewMsg struct {
	layout engine.CoexistDiskLayout
	err    error
}
type coexistInitializedMsg struct {
	layout engine.CoexistDiskLayout
	parts  []PartitionInfo
	err    error
}

func PreviewCoexistInitialization(device string) (engine.CoexistDiskLayout, error) {
	return engine.PreviewCoexistDisk(device, DetectLiveDisk())
}

func (m model) startCoexistPreview(preview func(string) (engine.CoexistDiskLayout, error)) (tea.Model, tea.Cmd) {
	if m.diskModeIdx != 2 || m.diskIdx < 0 || m.diskIdx >= len(m.disks) {
		return m, nil
	}
	device := m.disks[m.diskIdx].Path
	m.initialization = &coexistInitialization{busy: true}
	m.diskError = ""
	return m, func() tea.Msg {
		layout, err := preview(device)
		return coexistPreviewMsg{layout, err}
	}
}

func (m model) receiveCoexistPreview(msg coexistPreviewMsg) (tea.Model, tea.Cmd) {
	if msg.err != nil {
		m.initialization, m.diskError = nil, msg.err.Error()
		return m, nil
	}
	v := viewport.New(max(50, m.termWidth-8), max(4, m.termHeight-14))
	var rows []string
	for _, p := range msg.layout.Partitions {
		rows = append(rows, fmt.Sprintf("%-20s %-13s %8.2f GiB  %s", p.Device, p.Label, float64(p.Sectors*msg.layout.SectorSize)/(1<<30), p.Filesystem))
	}
	rows[len(rows)-1] += " (remainder)"
	v.SetContent(strings.Join(rows, "\n"))
	m.initialization = &coexistInitialization{layout: msg.layout, view: v, reviewed: v.AtBottom()}
	return m, nil
}

func (m model) updateCoexistInitialization(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	i := m.initialization
	if i.busy {
		return m, nil
	}
	switch msg.String() {
	case "esc", "ctrl+c":
		m.initialization = nil
	case "home":
		i.view.GotoTop()
	case "end":
		i.view.GotoBottom()
		i.reviewed = true
	case "up", "down", "pgup", "pgdown":
		i.view, _ = i.view.Update(msg)
		i.reviewed = i.reviewed || i.view.AtBottom()
	case "backspace", "ctrl+h":
		if len(i.confirmation) > 0 {
			i.confirmation = i.confirmation[:len(i.confirmation)-1]
		}
	case "enter":
		return m.confirmCoexistInitialization(engine.InitializeCoexistDisk, rediscoverInitializedDisk)
	default:
		if msg.Type == tea.KeyRunes && len(i.confirmation)+len(string(msg.Runes)) <= 256 {
			i.confirmation += string(msg.Runes)
		}
	}
	return m, nil
}

func (m model) confirmCoexistInitialization(initialize func(engine.CoexistDiskLayout, string) error, discover func(engine.CoexistDiskLayout) ([]PartitionInfo, error)) (tea.Model, tea.Cmd) {
	i := m.initialization
	if i == nil || i.busy || !i.reviewed || i.confirmation != i.layout.Device {
		return m, nil
	}
	layout, confirmation := i.layout, i.confirmation
	i.busy = true
	// Discard every old selection before any write; failed/partial preparation
	// must never leave a previously selected root available for installation.
	m.partIdx, m.efiIdx, m.homeIdx = -1, -1, -1
	m.candidateParts, m.efiParts, m.homeParts = nil, nil, nil
	return m, func() tea.Msg {
		err := initialize(layout, confirmation)
		var parts []PartitionInfo
		if err == nil {
			parts, err = discover(layout)
		}
		return coexistInitializedMsg{layout, parts, err}
	}
}

func (m model) receiveCoexistInitialization(msg coexistInitializedMsg) (tea.Model, tea.Cmd) {
	m.initialization = nil
	m.state = StateDisk
	m.diskField = 0
	if msg.err != nil {
		m.diskError = "Initialization stopped; no layout selected: " + msg.err.Error()
		return m, nil
	}
	// Select by the verified devices, never by convenience filesystem labels.
	l := msg.layout
	m.candidateParts = GetCandidatePartitions(msg.parts, "")
	m.efiParts = coexistEfiPartitions(msg.parts)
	for _, p := range msg.parts {
		if p.FsType == "ext4" {
			m.homeParts = append(m.homeParts, p)
		}
	}
	for n, p := range m.candidateParts {
		if p.Path == l.Partitions[1].Device {
			m.partIdx = n
		}
	}
	for n, p := range m.efiParts {
		if p.Path == l.Partitions[0].Device {
			m.efiIdx = n
		}
	}
	for n, p := range m.homeParts {
		if p.Path == l.Partitions[len(l.Partitions)-1].Device {
			m.homeIdx = n
		}
	}
	m.diskError = ""
	return m, nil
}

func (m model) viewCoexistInitialization() string {
	i := m.initialization
	if i.busy {
		return "Checking/preparing Coexist disk. Please wait; do not power off."
	}
	confirmation := "Scroll through the full layout before confirming."
	if i.reviewed {
		confirmation = "Type " + i.layout.Device + " and press Enter to ERASE it: " + i.confirmation
	}
	return redBgWhiteText.Render("Initialize disk for Coexist: ALL DATA ON "+i.layout.Device+" WILL BE ERASED") +
		"\nGPT / UEFI | ESP 512 MiB | roots 8 GiB each | HOME at least 16 GiB\n\n" +
		i.view.View() + "\n\n↑/↓ or PgUp/PgDown: review layout | Esc: cancel\n" + confirmation
}

func rediscoverInitializedDisk(l engine.CoexistDiskLayout) ([]PartitionInfo, error) {
	// START is reported in kernel 512-byte sectors, SIZE in bytes. Explicit
	// failures and exact geometry checks prevent accepting a stale/partial table.
	quoted := "'" + strings.ReplaceAll(l.Device, "'", "'\"'\"'") + "'"
	out, err := utils.ExecCapture("lsblk --bytes --json --output PATH,NAME,TYPE,SIZE,START,FSTYPE,LABEL,PARTTYPE,PTTYPE,MOUNTPOINTS " + quoted)
	if err != nil {
		return nil, err
	}
	var tree lsblkRoot
	if err := json.Unmarshal([]byte(out), &tree); err != nil {
		return nil, err
	}
	return validateInitializedDiscovery(l, tree)
}

func validateInitializedDiscovery(l engine.CoexistDiskLayout, tree lsblkRoot) ([]PartitionInfo, error) {
	if len(tree.BlockDevices) != 1 {
		return nil, fmt.Errorf("ambiguous disk discovery")
	}
	d := tree.BlockDevices[0]
	diskBytes, _ := parseLsblkSize(d.Size)
	if d.Path != l.Device || d.Type != "disk" || uint64(diskBytes) != l.DiskBytes || d.TableType != "gpt" || len(d.Children) != len(l.Partitions) {
		return nil, fmt.Errorf("unexpected partition table after initialization")
	}
	seen := make(map[string]bool)
	for _, p := range l.Partitions {
		found := false
		for _, node := range d.Children {
			if node.Path != p.Device {
				continue
			}
			size, _ := parseLsblkSize(node.Size)
			if seen[node.Path] || node.Type != "part" || len(node.Children) != 0 || node.Start*512 != p.Start*l.SectorSize || uint64(size) != p.Sectors*l.SectorSize || node.FsType == nil || *node.FsType != p.Filesystem || node.PartType == nil || !strings.EqualFold(*node.PartType, p.Type) {
				return nil, fmt.Errorf("unexpected geometry/filesystem on %s", p.Device)
			}
			for _, mount := range node.MountPoints {
				if mount != "" {
					return nil, fmt.Errorf("new partition %s is in use", p.Device)
				}
			}
			seen[node.Path], found = true, true
		}
		if !found {
			return nil, fmt.Errorf("missing new partition %s", p.Device)
		}
	}
	return collectPartitions(d.Children), nil
}
