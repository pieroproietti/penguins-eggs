package iso

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// ISOFile represents a generated ISO file.
type ISOFile struct {
	Path     string `json:"path"`
	Name     string `json:"name"`
	Size     int64  `json:"size"`
	Modified string `json:"modified"`
}

// List finds ISO files in the eggs snapshot directory.
func List(snapshotDir string) ([]ISOFile, error) {
	if snapshotDir == "" {
		snapshotDir = "/home/eggs"
	}

	var isos []ISOFile

	err := filepath.Walk(snapshotDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // skip errors
		}
		if !info.IsDir() && strings.HasSuffix(strings.ToLower(info.Name()), ".iso") {
			isos = append(isos, ISOFile{
				Path:     path,
				Name:     info.Name(),
				Size:     info.Size(),
				Modified: info.ModTime().Format(time.RFC3339),
			})
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("walking %s: %w", snapshotDir, err)
	}

	sort.Slice(isos, func(i, j int) bool {
		return isos[i].Modified > isos[j].Modified
	})

	return isos, nil
}

// FormatSize formats bytes into a human-readable string.
func FormatSize(bytes int64) string {
	const (
		KB = 1024
		MB = KB * 1024
		GB = MB * 1024
	)

	switch {
	case bytes >= GB:
		return fmt.Sprintf("%.2f GB", float64(bytes)/float64(GB))
	case bytes >= MB:
		return fmt.Sprintf("%.2f MB", float64(bytes)/float64(MB))
	case bytes >= KB:
		return fmt.Sprintf("%.2f KB", float64(bytes)/float64(KB))
	default:
		return fmt.Sprintf("%d B", bytes)
	}
}
