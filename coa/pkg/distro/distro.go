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
	"runtime"
	"strings"
	"time"
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
	osInfo := parseOsRelease()

	rawID := strings.ToLower(osInfo["ID"])
	rawLike := strings.ToLower(osInfo["ID_LIKE"])
	likes := strings.Fields(rawLike)

	d := &Distro{
		DistroID:   osInfo["ID"],
		CodenameID: osInfo["VERSION_CODENAME"],
		ReleaseID:  osInfo["VERSION_ID"],
	}

	candidates := append([]string{rawID}, likes...)

	for _, c := range candidates {
		switch c {
		case "debian", "ubuntu", "linuxmint", "kali", "pop":
			d.FamilyID = "debian"
			d.DistroLike = "Debian"
			return d

		case "alpine":
			d.FamilyID = "alpine"
			d.DistroLike = "Alpine"
			return d

		case "arch", "endeavouros", "garuda", "cachyos", "rebornos":
			d.FamilyID = "archlinux"
			d.DistroLike = "Arch"
			return d

		case "manjaro", "biglinux", "bigcommunity":
			d.FamilyID = "manjaro"
			d.DistroLike = "Manjaro"
			return d

		case "fedora", "nobara", "rhel", "centos":
			d.FamilyID = "fedora"
			d.DistroLike = "Fedora"
			return d

		case "opensuse":
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
