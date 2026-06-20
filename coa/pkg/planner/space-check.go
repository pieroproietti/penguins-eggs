package planner

import (
	"fmt"
	"os"
	"strings"

	"golang.org/x/sys/unix"
)

var compressionFactors = map[string]uint64{
	"xz":   31,
	"zstd": 35,
	"gzip": 37,
	"lzo":  52,
	"lzma": 52,
	"lz4":  52,
}

type SpaceReport struct {
	RootUsedKiB     uint64
	ExcludedKiB     uint64
	CompressedKiB   uint64
	FreeSnapshotKiB uint64
	FreeWorkKiB     uint64
	SnapshotDir     string
	WorkDir         string
	SamePartition   bool
}

func (r SpaceReport) NeededKiB() uint64 {
	if r.SamePartition {
		return r.CompressedKiB * 2
	}
	return r.CompressedKiB
}

func (r SpaceReport) String() string {
	const mib = 1024.0
	const gib = 1024.0 * 1024.0
	lines := []string{
		fmt.Sprintf("  Root used:        %.1f MiB", float64(r.RootUsedKiB)/mib),
		fmt.Sprintf("  Excluded:         %.1f MiB", float64(r.ExcludedKiB)/mib),
		fmt.Sprintf("  Estimated ISO:    %.1f MiB", float64(r.CompressedKiB)/mib),
		fmt.Sprintf("  Free on %s: %.2f GiB", r.SnapshotDir, float64(r.FreeSnapshotKiB)/gib),
	}
	if r.SamePartition {
		lines = append(lines, "  Work dir on same partition: needs ~2x ISO size")
	} else {
		lines = append(lines, fmt.Sprintf("  Free on %s: %.2f GiB", r.WorkDir, float64(r.FreeWorkKiB)/gib))
	}
	return strings.Join(lines, "\n")
}

func CheckDiskSpace(workDir string, snapshotDir string, compression string, excludeListPath string) (*SpaceReport, error) {
	factor, ok := compressionFactors[compression]
	if !ok {
		factor = 35 // default zstd
	}

	rootUsed, err := usedSpaceKiB("/")
	if err != nil {
		return nil, fmt.Errorf("cannot determine root usage: %w", err)
	}

	excludedSize := estimateExcludedKiB(excludeListPath)
	if excludedSize > rootUsed {
		excludedSize = rootUsed
	}

	compressedSize := (rootUsed - excludedSize) * factor / 100

	freeSnapshot, err := freeSpaceKiB(snapshotDir)
	if err != nil {
		return nil, fmt.Errorf("cannot determine free space on %s: %w", snapshotDir, err)
	}

	freeWork, err := freeSpaceKiB(workDir)
	if err != nil {
		freeWork = freeSnapshot
	}

	samePartition := onSameDevice(workDir, snapshotDir)

	return &SpaceReport{
		RootUsedKiB:     rootUsed,
		ExcludedKiB:     excludedSize,
		CompressedKiB:   compressedSize,
		FreeSnapshotKiB: freeSnapshot,
		FreeWorkKiB:     freeWork,
		SnapshotDir:     snapshotDir,
		WorkDir:         workDir,
		SamePartition:   samePartition,
	}, nil
}

func usedSpaceKiB(path string) (uint64, error) {
	var stat unix.Statfs_t
	if err := unix.Statfs(path, &stat); err != nil {
		return 0, err
	}
	blockSize := uint64(stat.Bsize)
	totalBytes := stat.Blocks * blockSize
	freeBytes := stat.Bfree * blockSize
	return (totalBytes - freeBytes) / 1024, nil
}

func freeSpaceKiB(path string) (uint64, error) {
	if err := os.MkdirAll(path, 0755); err != nil {
		return 0, err
	}
	var stat unix.Statfs_t
	if err := unix.Statfs(path, &stat); err != nil {
		return 0, err
	}
	return (stat.Bavail * uint64(stat.Bsize)) / 1024, nil
}

func onSameDevice(path1, path2 string) bool {
	var stat1, stat2 unix.Statfs_t
	if unix.Statfs(path1, &stat1) != nil || unix.Statfs(path2, &stat2) != nil {
		return true // conservative assumption
	}
	return stat1.Fsid == stat2.Fsid
}

func estimateExcludedKiB(excludeListPath string) uint64 {
	if excludeListPath == "" {
		return 0
	}
	data, err := os.ReadFile(excludeListPath)
	if err != nil {
		return 0
	}

	var totalKiB uint64
	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if strings.Contains(line, "*") || strings.Contains(line, "!") {
			continue
		}
		path := "/" + strings.TrimPrefix(line, "/")
		info, err := os.Stat(path)
		if err != nil {
			continue
		}
		if info.IsDir() {
			totalKiB += dirSizeKiB(path)
		} else {
			totalKiB += uint64(info.Size()) / 1024
		}
	}
	return totalKiB
}

func dirSizeKiB(path string) uint64 {
	var stat unix.Statfs_t
	if err := unix.Statfs(path, &stat); err != nil {
		return 0
	}
	blockSize := uint64(stat.Bsize)
	totalBytes := stat.Blocks * blockSize
	freeBytes := stat.Bfree * blockSize
	usedBytes := totalBytes - freeBytes

	// Se la directory è un mount point separato, il suo spazio usato
	// è indipendente dal root e va contato come esclusione
	var rootStat unix.Statfs_t
	if unix.Statfs("/", &rootStat) != nil {
		return 0
	}
	if stat.Fsid != rootStat.Fsid {
		return usedBytes / 1024
	}

	// Stessa partizione: usiamo una stima conservativa
	// basata sulla dimensione tipica di queste directory
	entries, err := os.ReadDir(path)
	if err != nil {
		return 0
	}
	var size uint64
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}
		size += uint64(info.Size())
	}
	return size / 1024
}
