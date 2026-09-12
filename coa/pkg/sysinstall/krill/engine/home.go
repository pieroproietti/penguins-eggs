package engine

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"coa/pkg/utils"
)

func ValidateHomeNamespace(namespace string) error {
	if err := ValidateInstallationID(namespace); err != nil {
		return err
	}
	if namespace == "common" {
		return fmt.Errorf("Installation ID cannot be common (reserved shared HOME namespace)")
	}
	return nil
}

type filesystemInfo struct{ Type, UUID string }

func shellQuote(s string) string { return "'" + strings.ReplaceAll(s, "'", "'\"'\"'") + "'" }

func probeFilesystem(device string) (filesystemInfo, error) {
	out, err := utils.ExecCapture("blkid -p -o export " + shellQuote(device))
	if err != nil {
		return filesystemInfo{}, err
	}
	var info filesystemInfo
	for _, line := range strings.Split(out, "\n") {
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		switch key {
		case "TYPE":
			info.Type = value
		case "UUID":
			info.UUID = value
		}
	}
	if info.Type == "" || info.UUID == "" || strings.ContainsAny(info.UUID, " \t\n\\") {
		return info, fmt.Errorf("missing or invalid filesystem type/UUID on %s", device)
	}
	return info, nil
}

// A missing namespace will be created; an existing real directory is preserved.
func validateHomeDestination(storage, namespace string) error {
	if err := ValidateHomeNamespace(namespace); err != nil {
		return err
	}
	info, err := os.Lstat(filepath.Join(storage, namespace))
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	if !info.IsDir() {
		return fmt.Errorf("HOME namespace %q is not a real directory", namespace)
	}
	return nil
}

// Inspect without replaying the ext4 journal or exposing shared storage to unpackfs.
func inspectHomePartition(device, namespace string) (result error) {
	dir, err := os.MkdirTemp("", "krill-home-check-")
	if err != nil {
		return err
	}
	defer func() { result = errors.Join(result, os.Remove(dir)) }()
	if err := utils.ExecQuiet("mount -t ext4 -o ro,noload " + shellQuote(device) + " " + shellQuote(dir)); err != nil {
		return err
	}
	defer func() { result = errors.Join(result, utils.ExecQuiet("umount "+shellQuote(dir))) }()
	return validateHomeDestination(dir, namespace)
}

// Insert one installer-only module into the existing sequence, rejecting unsafe
// custom sequences and clone images without normal user creation before formatting.
func installationSequence(plan *Plan) ([]string, error) {
	if plan.Mode != "coexist" {
		return plan.Exec, nil
	}
	required := []string{"partition", "mount", "unpackfs", "removeuser", "fstab", "users", "umount"}
	last := -1
	removeIndex := -1
	for _, name := range required {
		index, count := -1, 0
		for i, module := range plan.Exec {
			if module == name {
				index = i
				count++
			}
		}
		if count != 1 || index <= last {
			return nil, fmt.Errorf("Coexist requires ordered partition, mount, unpackfs, removeuser, fstab, users and umount modules")
		}
		last = index
		if name == "removeuser" {
			removeIndex = index
		}
	}
	for _, name := range plan.Exec {
		if name == "coexistmount" {
			return nil, fmt.Errorf("coexistmount is inserted by the installer")
		}
	}
	seq := append([]string{}, plan.Exec[:removeIndex+1]...)
	seq = append(seq, "coexistmount")
	return append(seq, plan.Exec[removeIndex+1:]...), nil
}

// Reject symlink mountpoints inherited from the image instead of following them
// outside the target. Existing real directories remain untouched.
func (c *ctx) targetDirectory(parts ...string) (string, error) {
	path := c.plan.Target
	for _, part := range parts {
		path = filepath.Join(path, part)
		if err := os.Mkdir(path, 0755); err != nil && !os.IsExist(err) {
			return "", err
		}
		info, err := os.Lstat(path)
		if err != nil {
			return "", err
		}
		if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
			return "", fmt.Errorf("unsafe mount directory %s", path)
		}
	}
	return path, nil
}

func runCoexistMount(c *ctx) error {
	p := c.plan
	if p.Mode != "coexist" {
		return fmt.Errorf("shared HOME mount requires Coexist")
	}
	if err := ValidateHomeNamespace(p.HomeNamespace); err != nil {
		return err
	}
	storage, err := c.targetDirectory("srv", "homes")
	if err != nil {
		return err
	}
	home, err := c.targetDirectory("home")
	if err != nil {
		return err
	}
	info, err := c.safetyChecks().filesystem(p.HomePartition)
	if err != nil {
		return err
	}
	if info.Type != "ext4" || info.UUID == "" {
		return fmt.Errorf("shared HOME filesystem changed or UUID unavailable")
	}
	if err := c.mount("-t", info.Type, p.HomePartition, storage); err != nil {
		return err
	}
	namespace := filepath.Join(storage, p.HomeNamespace)
	if err := os.Mkdir(namespace, 0755); err != nil && !os.IsExist(err) {
		return err
	}
	if err := validateHomeDestination(storage, p.HomeNamespace); err != nil {
		return err
	}
	if err := c.mount("--bind", namespace, home); err != nil {
		return err
	}
	esp, err := c.targetDirectory("boot", "efi")
	if err != nil {
		return err
	}
	return c.mount("-t", "vfat", p.EspPartition, esp)
}
