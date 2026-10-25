package census

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

func getOrCreateUUID() (string, error) {
	return getOrCreateUUIDForTarget("")
}

func getOrCreateUUIDForTarget(targetRoot string) (string, error) {
	if customMachineID := strings.TrimSpace(os.Getenv("EGGS_MACHINE_ID_PATH")); customMachineID != "" {
		if id, ok := readAndDeriveMachineID(customMachineID); ok {
			return id, nil
		}
	} else if strings.TrimSpace(os.Getenv("EGGS_CENSUS_ID_PATH")) == "" {
		var machinePaths []string
		if targetRoot != "" {
			machinePaths = append(machinePaths,
				filepath.Join(targetRoot, "etc", "machine-id"),
				filepath.Join(targetRoot, "var", "lib", "dbus", "machine-id"),
			)
		}
		machinePaths = append(machinePaths, machineIDPath, dbusMachineIDPath)
		for _, p := range machinePaths {
			if id, ok := readAndDeriveMachineID(p); ok {
				return id, nil
			}
		}
	}

	paths := candidateUUIDPaths()

	for _, p := range paths {
		if data, err := os.ReadFile(p); err == nil {
			id := strings.TrimSpace(string(data))
			if isValidUUID(id) {
				return id, nil
			}
		}
	}

	newID, err := generateUUIDv4()
	if err != nil {
		return "", err
	}

	for _, p := range paths {
		dir := filepath.Dir(p)
		if err := os.MkdirAll(dir, 0755); err != nil {
			continue
		}
		if err := os.WriteFile(p, []byte(newID+"\n"), 0644); err == nil {
			return newID, nil
		}
	}

	return newID, nil
}

func readAndDeriveMachineID(path string) (string, bool) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", false
	}
	mid := strings.TrimSpace(string(data))
	if !isValidMachineID(mid) {
		return "", false
	}
	return deriveUUIDFromMachineID(mid), true
}

func isValidMachineID(s string) bool {
	if len(s) != 32 {
		return false
	}
	allZero := true
	for i := 0; i < len(s); i++ {
		c := s[i]
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
		if c != '0' {
			allZero = false
		}
	}
	return !allZero
}

// DeriveUUIDFromMachineID derives a deterministic RFC 4122 v5 UUID from a raw machine-id string.
func DeriveUUIDFromMachineID(machineID string) string {
	return deriveUUIDFromMachineID(machineID)
}

func deriveUUIDFromMachineID(machineID string) string {
	normalized := strings.ToLower(strings.TrimSpace(machineID))
	sum := sha256.Sum256([]byte("penguins-eggs-census:" + normalized))
	var b [16]byte
	copy(b[:], sum[:16])
	b[6] = (b[6] & 0x0f) | 0x50 // Version 5 (name-based deterministic UUID)
	b[8] = (b[8] & 0x3f) | 0x80 // Variant RFC 4122
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

// GetAnonymizedMachineID returns the anonymized UUID derived from the host machine-id,
// or a fallback UUID if machine-id is not available or uninitialized.
func GetAnonymizedMachineID() string {
	if customMachineID := strings.TrimSpace(os.Getenv("EGGS_MACHINE_ID_PATH")); customMachineID != "" {
		if id, ok := readAndDeriveMachineID(customMachineID); ok {
			return id
		}
	}

	for _, p := range []string{machineIDPath, dbusMachineIDPath} {
		if id, ok := readAndDeriveMachineID(p); ok {
			return id
		}
	}

	if u, err := getOrCreateUUID(); err == nil && u != "" {
		return u
	}
	return ""
}

// InjectParentIDToLiveRoot writes the parent-id (anonymized machine-id of the current host)
// into <liveRoot>/etc/penguins-eggs.d/parent-id so that it is included inside the SquashFS.
// It strictly guards against writing to the real host root ("/", "", or clean == "/").
func InjectParentIDToLiveRoot(liveRoot string) (string, error) {
	clean := filepath.Clean(strings.TrimSpace(liveRoot))
	if clean == "" || clean == "/" || clean == "." {
		return "", fmt.Errorf("invalid liveRoot destination: %q", liveRoot)
	}
	parentID := GetAnonymizedMachineID()
	if parentID == "" {
		return "", fmt.Errorf("unable to determine anonymized machine-id")
	}
	targetDir := filepath.Join(clean, "etc", "penguins-eggs.d")
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return "", err
	}
	targetFile := filepath.Join(targetDir, "parent-id")
	if err := os.WriteFile(targetFile, []byte(parentID+"\n"), 0644); err != nil {
		return "", err
	}
	return parentID, nil
}

// DetectParentID attempts to discover the parent-id from environment variables,
// target root filesystem, or system locations (/etc/penguins-eggs.d/parent-id, sibling.yaml).
func DetectParentID(targetRoot string) string {
	if custom := strings.TrimSpace(os.Getenv("EGGS_PARENT_ID")); custom != "" && isValidUUID(custom) {
		return custom
	}
	if customPath := strings.TrimSpace(os.Getenv("EGGS_PARENT_ID_PATH")); customPath != "" {
		if id := readParentIDFromFile(customPath); id != "" {
			return id
		}
	}

	var candidateFiles []string
	if targetRoot != "" {
		candidateFiles = append(candidateFiles,
			filepath.Join(targetRoot, "etc", "penguins-eggs.d", "parent-id"),
			filepath.Join(targetRoot, "etc", "penguins-eggs", "parent-id"),
			filepath.Join(targetRoot, "etc", "penguins-eggs.d", "sibling.yaml"),
			filepath.Join(targetRoot, "etc", "penguins-eggs", "sibling.yaml"),
		)
	}
	candidateFiles = append(candidateFiles,
		systemParentIDPath,
		systemParentIDDirDPath,
		"/etc/penguins-eggs.d/sibling.yaml",
		"/etc/penguins-eggs/sibling.yaml",
	)

	for _, f := range candidateFiles {
		if id := readParentIDFromFile(f); id != "" {
			return id
		}
	}

	return ""
}

func readParentIDFromFile(p string) string {
	data, err := os.ReadFile(p)
	if err != nil {
		return ""
	}
	content := strings.TrimSpace(string(data))
	if strings.HasSuffix(p, ".yaml") || strings.HasSuffix(p, ".yml") {
		for _, line := range strings.Split(content, "\n") {
			line = strings.TrimSpace(line)
			if strings.HasPrefix(line, "parent_id:") || strings.HasPrefix(line, "parent-id:") {
				parts := strings.SplitN(line, ":", 2)
				if len(parts) == 2 {
					val := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
					if isValidUUID(val) {
						return val
					}
				}
			}
		}
		return ""
	}
	if isValidUUID(content) {
		return content
	}
	return ""
}

// DetectParentIDFromSource inspects the running system, live media, or source squashfs/iso image
// to determine the parent-id saved during remaster.
func DetectParentIDFromSource(squashfsPath string) string {
	if id := DetectParentID(""); id != "" {
		return id
	}

	var candidates []string

	if squashfsPath != "" {
		dir := filepath.Dir(squashfsPath)
		candidates = append(candidates,
			filepath.Join(dir, "parent_id"),
			filepath.Join(dir, "live", "parent_id"),
			filepath.Join(dir, "..", "parent_id"),
			filepath.Join(dir, "..", "live", "parent_id"),
			filepath.Join(dir, "..", "..", "parent_id"),
		)
	}

	// Standard live media mountpoints across supported distributions
	candidates = append(candidates,
		"/run/live/medium/parent_id",
		"/run/live/medium/live/parent_id",
		"/lib/live/mount/medium/parent_id",
		"/lib/live/mount/medium/live/parent_id",
		"/run/archiso/bootmnt/parent_id",
		"/run/miso/bootmnt/parent_id",
		"/run/initramfs/live/parent_id",
		"/run/initramfs/live/live/parent_id",
		"/live/parent_id",
	)

	for _, c := range candidates {
		if id := readParentIDFromFile(c); id != "" {
			return id
		}
	}

	if squashfsPath != "" {
		if _, err := os.Stat(squashfsPath); err == nil {
			ctx, cancel := context.WithTimeout(context.Background(), 1500*time.Millisecond)
			defer cancel()

			if strings.HasSuffix(squashfsPath, ".iso") {
				for _, target := range []string{"parent_id", "live/parent_id"} {
					if out, err := exec.CommandContext(ctx, "bsdtar", "-O", "-xf", squashfsPath, target).Output(); err == nil {
						id := strings.TrimSpace(string(out))
						if isValidUUID(id) {
							return id
						}
					}
				}
			} else {
				// 1. Try reading parent_id / live/parent_id / etc/penguins-eggs.d/parent-id from squashfs
				for _, target := range []string{"parent_id", "live/parent_id", "etc/penguins-eggs.d/parent-id"} {
					if out, err := exec.CommandContext(ctx, "unsquashfs", "-cat", squashfsPath, target).Output(); err == nil {
						id := strings.TrimSpace(string(out))
						if isValidUUID(id) {
							return id
						}
					}
				}

				// 2. Try reading etc/penguins-eggs.d/sibling.yaml from squashfs
				if out, err := exec.CommandContext(ctx, "unsquashfs", "-cat", squashfsPath, "etc/penguins-eggs.d/sibling.yaml").Output(); err == nil {
					for _, line := range strings.Split(string(out), "\n") {
						line = strings.TrimSpace(line)
						if strings.HasPrefix(line, "parent_id:") || strings.HasPrefix(line, "parent-id:") {
							parts := strings.SplitN(line, ":", 2)
							if len(parts) == 2 {
								val := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
								if isValidUUID(val) {
									return val
								}
							}
						}
					}
				}
			}
		}
	}

	return ""
}

func candidateUUIDPaths() []string {
	var paths []string
	if customPath := strings.TrimSpace(os.Getenv("EGGS_CENSUS_ID_PATH")); customPath != "" {
		return []string{customPath}
	}

	if os.Geteuid() == 0 {
		paths = append(paths, systemCensusIDPath, systemCensusDirDPath)
	}

	if cfgDir, err := os.UserConfigDir(); err == nil && cfgDir != "" {
		paths = append(paths, filepath.Join(cfgDir, "penguins-eggs", ".census_id"))
	}

	if os.Geteuid() != 0 {
		paths = append(paths, systemCensusIDPath, systemCensusDirDPath)
	}

	return paths
}

func generateUUIDv4() (string, error) {
	var b [16]byte
	if _, err := io.ReadFull(rand.Reader, b[:]); err != nil {
		return "", err
	}
	b[6] = (b[6] & 0x0f) | 0x40 // Version 4
	b[8] = (b[8] & 0x3f) | 0x80 // Variant RFC 4122
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:16]), nil
}

func isValidUUID(u string) bool {
	if len(u) != 36 {
		return false
	}
	for i, c := range u {
		switch i {
		case 8, 13, 18, 23:
			if c != '-' {
				return false
			}
		default:
			if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
				return false
			}
		}
	}
	return true
}
