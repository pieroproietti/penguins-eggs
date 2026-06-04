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

// Clean esegue la pulizia del sistema per recuperare spazio prima del remastering
func (b *Bleach) Clean() error {
	d := distro.NewDistro()

	b.log(fmt.Sprintf("Inizio pulizia per famiglia: %s", d.FamilyID))

	// 1. Pulizia Gestore Pacchetti in base alla distro
	switch d.FamilyID {
	case "alpine":
		b.run("apk", "cache", "clean")
		b.run("apk", "cache", "purge")

	case "archlinux":
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

	// 2. Cache di terze parti (Flatpak & Snap)
	b.log("Pulizia cache Flatpak e Snap")
	if matches, err := filepath.Glob("/var/tmp/flatpak-cache-*"); err == nil {
		for _, match := range matches {
			os.RemoveAll(match)
		}
	}
	// Snap conserva versioni vecchie disabilitate che occupano GB
	os.RemoveAll("/var/lib/snapd/cache")

	// 3. Cronologia Shell (Root)
	b.log("Pulizia cronologia shell di root")
	os.RemoveAll("/root/.bash_history")
	os.RemoveAll("/root/.zsh_history")

	// 4. Pulizia Journald / Syslog
	b.log("Pulizia log di sistema")
	if _, err := os.Stat("/run/systemd/system"); err == nil {
		b.run("journalctl", "--rotate")
		b.run("journalctl", "--vacuum-time=1s")
	} else {
		// Per i sistemi sysvinit / openrc
		b.run("sh", "-c", "find /var/log -name '*gz' -print0 | xargs -0r rm -f")
		b.run("sh", "-c", "find /var/log/ -type f -exec truncate -s 0 {} \\;")
	}

	// 5. System Cache (PageCache, dentries, inodes)
	b.log("Svuotamento cache Kernel (PageCache, dentries e inodes)")
	b.run("sync")
	os.WriteFile("/proc/sys/vm/drop_caches", []byte("3"), 0644)

	return nil
}
