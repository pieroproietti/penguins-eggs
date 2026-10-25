package census

import (
	"encoding/json"
	"os"
	"os/user"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
)

func isDir(path string) bool {
	if path == "" {
		return false
	}
	fi, err := os.Stat(path)
	return err == nil && fi.IsDir()
}

func resolveTargetRoot(explicit, action string) string {
	if explicit = strings.TrimSpace(explicit); explicit != "" && isDir(explicit) {
		return explicit
	}
	if action != "sysinstall" {
		return ""
	}
	if envRoot := strings.TrimSpace(os.Getenv("TARGET_ROOT")); envRoot != "" && isDir(envRoot) {
		return envRoot
	}
	if matches, err := filepath.Glob("/tmp/calamares-root-*"); err == nil {
		for _, m := range matches {
			if isDir(filepath.Join(m, "etc")) {
				return m
			}
		}
	}
	return ""
}

func saveLocalPayload(data []byte) {
	paths, sudoUID, sudoGID, sudoHome := candidatePayloadPaths()

	wrotePrimary := false
	for _, p := range paths {
		dir := filepath.Dir(p)
		if err := os.MkdirAll(dir, 0755); err != nil {
			continue
		}
		if err := os.WriteFile(p, data, 0644); err == nil {
			if sudoUID >= 0 && sudoGID >= 0 && sudoHome != "" && strings.HasPrefix(p, sudoHome+string(filepath.Separator)) {
				_ = os.Chown(filepath.Join(sudoHome, ".config"), sudoUID, sudoGID)
				_ = os.Chown(dir, sudoUID, sudoGID)
				_ = os.Chown(p, sudoUID, sudoGID)
			}
			wrotePrimary = true
			break
		}
	}

	// When running as root (outside isolated HOME unit tests), also persist a system-wide copy
	// in /etc/penguins-eggs/census.json so it is never hidden solely under /root/.config.
	if wrotePrimary && os.Geteuid() == 0 && strings.TrimSpace(os.Getenv("EGGS_CENSUS_PAYLOAD_PATH")) == "" {
		homeEnv := strings.TrimSpace(os.Getenv("HOME"))
		if homeEnv == "" || homeEnv == "/root" || (sudoHome != "" && homeEnv == sudoHome) {
			sysDir := filepath.Dir(systemCensusJSONPath)
			if err := os.MkdirAll(sysDir, 0755); err == nil {
				_ = os.WriteFile(systemCensusJSONPath, data, 0644)
			}
		}
	}
}

// saveTargetPayload copies census.json into the installed target filesystem
// (<targetRoot>/etc/penguins-eggs/census.json and <targetRoot>/home/<user>/.config/penguins-eggs/census.json)
// so the user finds it immediately after first boot.
func saveTargetPayload(data []byte, targetRoot, targetUser string) {
	if !isDir(targetRoot) {
		return
	}

	targetEtcDir := filepath.Join(targetRoot, "etc", "penguins-eggs")
	if err := os.MkdirAll(targetEtcDir, 0755); err == nil {
		_ = os.WriteFile(filepath.Join(targetEtcDir, "census.json"), data, 0644)
	}

	var p Payload
	if err := json.Unmarshal(data, &p); err == nil && p.ParentID != "" {
		targetDirD := filepath.Join(targetRoot, "etc", "penguins-eggs.d")
		if err := os.MkdirAll(targetDirD, 0755); err == nil {
			_ = os.WriteFile(filepath.Join(targetDirD, "parent-id"), []byte(p.ParentID+"\n"), 0644)
		}
	}

	// Purge stale .census_id residues from target so the freshly installed machine
	// always derives its unique identity from its newly generated /etc/machine-id,
	// while preserving etc/penguins-eggs.d/parent-id.
	_ = os.Remove(filepath.Join(targetRoot, "etc", "penguins-eggs", ".census_id"))
	_ = os.Remove(filepath.Join(targetRoot, "etc", "penguins-eggs.d", ".census_id"))

	seenUsers := make(map[string]bool)
	var userDirs []string
	addUserDir := func(uname string) {
		uname = strings.TrimSpace(uname)
		if uname == "" || uname == "eggs" || uname == "lost+found" || seenUsers[uname] {
			return
		}
		uhome := filepath.Join(targetRoot, "home", uname)
		if isDir(uhome) {
			seenUsers[uname] = true
			userDirs = append(userDirs, uhome)
		}
	}

	addUserDir(targetUser)
	if entries, err := os.ReadDir(filepath.Join(targetRoot, "home")); err == nil {
		for _, entry := range entries {
			if entry.IsDir() {
				addUserDir(entry.Name())
			}
		}
	}

	for _, uhome := range userDirs {
		uid, gid := dirOwner(uhome)
		cfgDir := filepath.Join(uhome, ".config")
		eggsDir := filepath.Join(cfgDir, "penguins-eggs")
		if err := os.MkdirAll(eggsDir, 0755); err != nil {
			continue
		}
		p := filepath.Join(eggsDir, "census.json")
		if err := os.WriteFile(p, data, 0644); err == nil && uid >= 0 && gid >= 0 {
			_ = os.Chown(cfgDir, uid, gid)
			_ = os.Chown(eggsDir, uid, gid)
			_ = os.Chown(p, uid, gid)
		}
	}
}

func dirOwner(path string) (uid int, gid int) {
	fi, err := os.Stat(path)
	if err != nil {
		return -1, -1
	}
	if st, ok := fi.Sys().(*syscall.Stat_t); ok && st != nil {
		return int(st.Uid), int(st.Gid)
	}
	return -1, -1
}

func resolveSudoIdentity() (sudoUID int, sudoGID int, sudoHome string) {
	sudoUID = -1
	sudoGID = -1
	if os.Geteuid() != 0 {
		return sudoUID, sudoGID, sudoHome
	}

	if envUID, err := strconv.Atoi(strings.TrimSpace(os.Getenv("SUDO_UID"))); err == nil && envUID > 0 {
		sudoUID = envUID
	}
	if envGID, err := strconv.Atoi(strings.TrimSpace(os.Getenv("SUDO_GID"))); err == nil && envGID >= 0 {
		sudoGID = envGID
	}

	if sudoUser := strings.TrimSpace(os.Getenv("SUDO_USER")); sudoUser != "" && sudoUser != "root" {
		if u, err := user.Lookup(sudoUser); err == nil && u.HomeDir != "" {
			sudoHome = u.HomeDir
			if uid, err := strconv.Atoi(u.Uid); err == nil {
				sudoUID = uid
			}
			if gid, err := strconv.Atoi(u.Gid); err == nil {
				sudoGID = gid
			}
		} else {
			sudoHome = filepath.Join("/home", sudoUser)
		}
		return sudoUID, sudoGID, sudoHome
	}

	if pkUIDStr := strings.TrimSpace(os.Getenv("PKEXEC_UID")); pkUIDStr != "" && pkUIDStr != "0" {
		if u, err := user.LookupId(pkUIDStr); err == nil && u.HomeDir != "" {
			sudoHome = u.HomeDir
			if uid, err := strconv.Atoi(u.Uid); err == nil {
				sudoUID = uid
			}
			if gid, err := strconv.Atoi(u.Gid); err == nil {
				sudoGID = gid
			}
			return sudoUID, sudoGID, sudoHome
		}
	}

	// Fallback when invoked as root without SUDO_USER (e.g. su - or root launcher):
	// if /home has a normal user directory (UID >= 1000), use it.
	if entries, err := os.ReadDir("/home"); err == nil {
		for _, entry := range entries {
			name := entry.Name()
			if !entry.IsDir() || name == "eggs" || name == "lost+found" {
				continue
			}
			candidate := filepath.Join("/home", name)
			if uid, gid := dirOwner(candidate); uid >= 1000 && gid >= 0 {
				return uid, gid, candidate
			}
		}
	}

	return sudoUID, sudoGID, sudoHome
}

func candidatePayloadPaths() (paths []string, sudoUID int, sudoGID int, sudoHome string) {
	sudoUID = -1
	sudoGID = -1

	if customPath := strings.TrimSpace(os.Getenv("EGGS_CENSUS_PAYLOAD_PATH")); customPath != "" {
		return []string{customPath}, sudoUID, sudoGID, sudoHome
	}

	seen := make(map[string]bool)
	addPath := func(p string) {
		if p != "" && !seen[p] {
			seen[p] = true
			paths = append(paths, p)
		}
	}

	if os.Geteuid() == 0 && strings.TrimSpace(os.Getenv("XDG_CONFIG_HOME")) == "" {
		sudoUID, sudoGID, sudoHome = resolveSudoIdentity()
		homeEnv := strings.TrimSpace(os.Getenv("HOME"))
		if homeEnv == "" || homeEnv == "/root" || (sudoHome != "" && homeEnv == sudoHome) {
			if sudoHome != "" {
				addPath(filepath.Join(sudoHome, ".config", "penguins-eggs", "census.json"))
			}
			addPath(systemCensusJSONPath)
			addPath(systemCensusDirDJSONPath)
		}
	}

	if cfgDir, err := os.UserConfigDir(); err == nil && cfgDir != "" {
		addPath(filepath.Join(cfgDir, "penguins-eggs", "census.json"))
	} else if homeDir, err := os.UserHomeDir(); err == nil && homeDir != "" {
		addPath(filepath.Join(homeDir, ".config", "penguins-eggs", "census.json"))
	}

	addPath(systemCensusJSONPath)
	addPath(systemCensusDirDJSONPath)

	return paths, sudoUID, sudoGID, sudoHome
}
