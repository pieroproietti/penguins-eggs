// Copyright 2026 Piero Proietti <piero.proietti@gmail.com>.
// All rights reserved.

package bleach

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"coa/pkg/distro"
	"coa/pkg/utils"
)

type Bleach struct {
	Verbose bool
}

func New(verbose bool) *Bleach {
	return &Bleach{Verbose: verbose}
}

func (b *Bleach) log(msg string) {
	if b.Verbose {
		utils.LogNormal("[bleach] %s", msg)
	}
}

func (b *Bleach) run(name string, args ...string) {
	cmd := exec.Command(name, args...)
	if b.Verbose {
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
	}
	cmd.Run()
}

func (b *Bleach) Clean() error {
	d := distro.NewDistro()

	b.log(fmt.Sprintf("Starting cleanup for family: %s", d.FamilyID))

	switch d.FamilyID {
	case "alpine":
		b.run("apk", "cache", "clean")
		b.run("apk", "cache", "purge")

	case "archlinux" || "manjaro":
		b.run("sh", "-c", "yes | pacman -Scc")

	case "debian":
		b.run("apt-get", "clean")
		b.run("apt-get", "autoclean", "-y")
		os.RemoveAll("/var/lib/apt/lists/lock")

	case "fedora":
		b.run("sh", "-c", "dnf remove $(dnf repoquery --installonly --latest-limit=-1 -q) -y")
		b.run("dnf", "clean", "all")

	case "opensuse":
		b.run("zypper", "clean")
	}

	b.log("Cleaning Flatpak and Snap cache")
	if matches, err := filepath.Glob("/var/tmp/flatpak-cache-*"); err == nil {
		for _, match := range matches {
			os.RemoveAll(match)
		}
	}
	os.RemoveAll("/var/lib/snapd/cache")

	b.log("Cleaning root shell history")
	os.RemoveAll("/root/.bash_history")
	os.RemoveAll("/root/.zsh_history")

	b.log("Cleaning system logs")
	if _, err := os.Stat("/run/systemd/system"); err == nil {
		b.run("journalctl", "--rotate")
		b.run("journalctl", "--vacuum-time=1s")
	} else {
		b.run("sh", "-c", "find /var/log -name '*gz' -print0 | xargs -0r rm -f")
		b.run("sh", "-c", "find /var/log/ -type f -exec truncate -s 0 {} \\;")
	}

	b.log("Flushing kernel cache (PageCache, dentries and inodes)")
	b.run("sync")
	os.WriteFile("/proc/sys/vm/drop_caches", []byte("3"), 0644)

	return nil
}
