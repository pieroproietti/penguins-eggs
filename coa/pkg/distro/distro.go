// Copyright 2026 Piero Proietti <piero.proietti@gmail.com>.
// All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

package distro

import (
	"bufio"
	"coa/pkg/utils"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

type Distro struct {
	DistroID   string
	CodenameID string
	ReleaseID  string
	FamilyID   string
	DistroLike string
	Arch       string
}

func parseOsRelease() map[string]string {
	info := make(map[string]string)
	file, err := os.Open("/etc/os-release")
	if err != nil {
		return info
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, "=") {
			parts := strings.SplitN(line, "=", 2)
			key := parts[0]
			val := strings.Trim(parts[1], `"'`)
			info[key] = val
		}
	}
	return info
}

func NewDistro() *Distro {
	return fromOSRelease(parseOsRelease())
}

type brainIndex struct {
	Distributions []struct {
		ID   string   `yaml:"id"`
		Like []string `yaml:"like"`
	} `yaml:"distributions"`
}

func findBrainIndex() string {
	if root := os.Getenv("OA_PROJ_ROOT"); root != "" {
		p := filepath.Join(root, "coa", "brain.d", "index.yaml")
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	if root := os.Getenv("GITHUB_WORKSPACE"); root != "" {
		p := filepath.Join(root, "coa", "brain.d", "index.yaml")
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}

	installed := "/etc/penguins-eggs.d/brain.d/index.yaml"
	if _, err := os.Stat(installed); err == nil {
		return installed
	}

	searchPaths := []string{
		filepath.Join("coa", "brain.d", "index.yaml"),
		filepath.Join("..", "brain.d", "index.yaml"),
		filepath.Join("..", "..", "brain.d", "index.yaml"),
		filepath.Join("brain.d", "index.yaml"),
	}
	for _, p := range searchPaths {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

func mapEntryToFamily(id string) (string, string) {
	switch id {
	case "debian":
		return "debian", "Debian"
	case "alpine":
		return "alpine", "Alpine"
	case "manjaro":
		return "manjaro", "Manjaro"
	case "arch", "archlinux":
		return "archlinux", "Arch"
	case "fedora":
		return "fedora", "Fedora"
	case "opensuse", "suse":
		return "opensuse", "Opensuse"
	default:
		return id, id
	}
}

func matchBrainIndex(candidates []string) (string, string, bool) {
	indexPath := findBrainIndex()
	if indexPath == "" {
		return "", "", false
	}

	data, err := os.ReadFile(indexPath)
	if err != nil {
		return "", "", false
	}

	var idx brainIndex
	if err := yaml.Unmarshal(data, &idx); err != nil {
		return "", "", false
	}

	for _, c := range candidates {
		cLower := strings.ToLower(c)
		for _, entry := range idx.Distributions {
			entryIDLower := strings.ToLower(entry.ID)
			if cLower == entryIDLower {
				fam, like := mapEntryToFamily(entryIDLower)
				return fam, like, true
			}
			for _, l := range entry.Like {
				if cLower == strings.ToLower(l) {
					fam, like := mapEntryToFamily(entryIDLower)
					return fam, like, true
				}
			}
		}
	}

	return "", "", false
}

func fromOSRelease(osInfo map[string]string) *Distro {
	rawID := strings.ToLower(osInfo["ID"])
	rawLike := strings.ToLower(osInfo["ID_LIKE"])
	if rawLike == "" {
		rawLike = strings.ToLower(osInfo["LIKE_ID"])
	}
	likes := strings.Fields(rawLike)

	d := &Distro{
		DistroID:   osInfo["ID"],
		CodenameID: osInfo["VERSION_CODENAME"],
		ReleaseID:  osInfo["VERSION_ID"],
	}

	candidates := append([]string{rawID}, likes...)

	// 1. Dynamic detection via brain.d/index.yaml if available
	if familyID, distroLike, ok := matchBrainIndex(candidates); ok {
		d.FamilyID = familyID
		d.DistroLike = distroLike
		return d
	}

	// 2. Static fallback if brain.d/index.yaml is missing
	for _, c := range candidates {
		switch c {
		case "debian", "ubuntu", "devuan", "kali", "linuxmint", "openkylin", "pop", "quirinux", "abellha":
			d.FamilyID = "debian"
			d.DistroLike = "Debian"
			return d

		case "alpine":
			d.FamilyID = "alpine"
			d.DistroLike = "Alpine"
			return d

		case "manjaro", "biglinux", "bigcommunity":
			d.FamilyID = "manjaro"
			d.DistroLike = "Manjaro"
			return d

		case "arch", "archlinux", "garuda", "endeavouros", "cachyos", "archcraft", "rebornos":
			d.FamilyID = "archlinux"
			d.DistroLike = "Arch"
			return d

		case "fedora", "rhel", "nobara":
			d.FamilyID = "fedora"
			d.DistroLike = "Fedora"
			return d

		case "opensuse", "suse", "opensuse-slowroll", "opensuse-tumbleweed":
			d.FamilyID = "opensuse"
			d.DistroLike = "Opensuse"
			return d
		}
	}

	utils.LogNormal("[coa] Distro not specifically mapped (%s). Generic mode.", osInfo["ID"])
	d.FamilyID = "generic"
	d.DistroLike = osInfo["ID"]
	return d
}

func (d *Distro) identityParts() (distroName, codeName, hostName, arch string) {
	distroName = strings.ToLower(strings.ReplaceAll(d.DistroID, " ", "-"))

	codeName = strings.ToLower(strings.ReplaceAll(d.CodenameID, " ", "-"))
	if codeName == "" {
		codeName = strings.ToLower(strings.ReplaceAll(d.ReleaseID, " ", "-"))
	}

	hostName, err := os.Hostname()
	if err != nil {
		hostName = "unknown"
	}
	hostName = strings.ToLower(strings.ReplaceAll(hostName, " ", "-"))

	arch = d.Arch
	if arch == "" {
		arch = runtime.GOARCH
	}

	return distroName, codeName, hostName, arch
}

func (d *Distro) GetISOName(variant string) string {
	timestamp := time.Now().Format("2006-01-02_1504")
	prefix := d.GetISOPrefix(variant)
	ext := ".iso"
	arch := d.Arch
	if arch == "" {
		arch = runtime.GOARCH
	}
	if arch == "riscv64" {
		ext = ".img"
	}
	return fmt.Sprintf("%s%s%s", prefix, timestamp, ext)
}

func (d *Distro) GetISOPrefix(variant string) string {
	distroName, codeName, hostName, arch := d.identityParts()

	variantSuffix := ""
	if variant != "" && variant != "standard" {
		variantSuffix = "-" + variant
	}

	if codeName == "" {
		return fmt.Sprintf("egg-of-%s-%s%s-%s-", distroName, hostName, variantSuffix, arch)
	}

	return fmt.Sprintf("egg-of-%s-%s-%s%s-%s-", distroName, codeName, hostName, variantSuffix, arch)
}

func (d *Distro) GetISOSearchPattern() string {
	distroName, codeName, hostName, arch := d.identityParts()

	if codeName == "" {
		return fmt.Sprintf("egg-of-%s-%s*-%s-*.iso", distroName, hostName, arch)
	}

	return fmt.Sprintf("egg-of-%s-%s-%s*-%s-*.iso", distroName, codeName, hostName, arch)
}
