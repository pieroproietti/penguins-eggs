// Moduli di configurazione del sistema installato: unpackfs, machineid,
// fstab, locale/timezone e tastiera.
package engine

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func runUnpackfs(c *ctx) error {
	src := c.plan.UnpackSource
	if src == "" || !exists(src) {
		return fmt.Errorf("source filesystem not found: %q", src)
	}
	if _, err := exec.LookPath("unsquashfs"); err != nil {
		return fmt.Errorf("unsquashfs not available on the live system")
	}
	// -f scrive su directory esistente (il target è già montato)
	return c.run("unsquashfs", "-f", "-no-progress", "-d", c.plan.Target, src)
}

func runMachineid(c *ctx) error {
	// machine-id vuoto: systemd ne rigenera uno al primo avvio
	if err := os.WriteFile(c.tpath("etc", "machine-id"), nil, 0644); err != nil {
		return err
	}
	// dbus deve puntare allo stesso id (symlink, come da machineid.conf)
	dbusID := c.tpath("var", "lib", "dbus", "machine-id")
	if exists(c.tpath("var", "lib", "dbus")) {
		os.Remove(dbusID)
		if err := os.Symlink("/etc/machine-id", dbusID); err != nil {
			c.logf("dbus machine-id symlink not created: %v", err)
		}
	}
	return nil
}

func runFstab(c *ctx) error {
	plan := c.plan
	l := partsFor(plan)

	var lines []string
	lines = append(lines, "# /etc/fstab - generato da krill (penguins-eggs)")

	if plan.FsType == "btrfs" {
		opts := "defaults"
		if plan.TableType == "gpt" {
			opts = "defaults,compress=zstd:1"
		}
		uuid := c.uuidOf(l.Root)

		// root subvolume
		lines = append(lines, fmt.Sprintf("UUID=%s / btrfs subvol=/@,%s 0 1", uuid, opts))
		// subvolumes standard
		lines = append(lines, fmt.Sprintf("UUID=%s /home btrfs subvol=/@home,%s 0 2", uuid, opts))
		lines = append(lines, fmt.Sprintf("UUID=%s /var/cache btrfs subvol=/@cache,%s 0 2", uuid, opts))
		lines = append(lines, fmt.Sprintf("UUID=%s /var/log btrfs subvol=/@log,%s 0 2", uuid, opts))
		lines = append(lines, fmt.Sprintf("UUID=%s /.snapshots btrfs subvol=/@snapshots,%s 0 2", uuid, opts))

		if plan.Swap == "file" {
			// Monta il subvolume per lo swap
			lines = append(lines, fmt.Sprintf("UUID=%s /swap btrfs subvol=/@swap,defaults,noatime 0 2", uuid))
			if err := c.makeSwapfile(c.tpath("swap", "swapfile")); err != nil {
				return err
			}
			lines = append(lines, "/swap/swapfile none swap sw 0 0")
		}
	} else {
		rootOptions := "defaults,noatime"
		lines = append(lines, fmt.Sprintf("UUID=%s / %s %s 0 1", c.uuidOf(l.Root), plan.FsType, rootOptions))
		if plan.Swap == "file" {
			if err := c.makeSwapfile(c.tpath("swapfile")); err != nil {
				return err
			}
			lines = append(lines, "/swapfile none swap sw 0 0")
		}
	}

	if l.Esp != "" {
		lines = append(lines, fmt.Sprintf("UUID=%s /boot/efi vfat defaults,umask=0077 0 2", c.uuidOf(l.Esp)))
	}
	if l.Swap != "" {
		lines = append(lines, fmt.Sprintf("UUID=%s none swap sw 0 0", c.uuidOf(l.Swap)))
	}

	return os.WriteFile(c.tpath("etc", "fstab"), []byte(strings.Join(lines, "\n")+"\n"), 0644)
}

func (c *ctx) uuidOf(device string) string {
	out, err := exec.Command("blkid", "-s", "UUID", "-o", "value", device).Output()
	if err != nil {
		c.logf("blkid %s failed: %v", device, err)
		return ""
	}
	return strings.TrimSpace(string(out))
}

// makeSwapfile crea il file di swap da 2GiB nel target.
func (c *ctx) makeSwapfile(path string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}

	// Su BTRFS dobbiamo disabilitare il CoW prima di scrivere nel file
	if c.plan.FsType == "btrfs" {
		f, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0600)
		if err != nil {
			return err
		}
		f.Close()

		if err := c.run("chattr", "+C", path); err != nil {
			c.logf("warning: chattr +C failed on %s: %v", path, err)
		}
	}

	if err := c.run("fallocate", "-l", "2G", path); err != nil {
		// fallback per filesystem senza fallocate
		if err := c.run("dd", "if=/dev/zero", "of="+path, "bs=1M", "count=2048"); err != nil {
			return err
		}
	}
	if err := os.Chmod(path, 0600); err != nil {
		return err
	}
	return c.run("mkswap", path)
}

func runLocale(c *ctx) error {
	lang := c.plan.Language
	if lang == "" {
		lang = "en_US.UTF-8"
	}

	// Stile Debian: /etc/default/locale
	if exists(c.tpath("etc", "default")) {
		os.WriteFile(c.tpath("etc", "default", "locale"), []byte("LANG="+lang+"\n"), 0644)
	}
	// Stile Arch/Fedora/Alpine: /etc/locale.conf
	os.WriteFile(c.tpath("etc", "locale.conf"), []byte("LANG="+lang+"\n"), 0644)

	// locale.gen: assicura la riga della lingua e rigenera (dove esiste)
	localeGen := c.tpath("etc", "locale.gen")
	if exists(localeGen) {
		data, _ := os.ReadFile(localeGen)
		entry := lang + " UTF-8"
		if !strings.Contains(string(data), "\n"+entry) {
			os.WriteFile(localeGen, append(data, []byte("\n"+entry+"\n")...), 0644)
		}
		if exists(c.tpath("usr", "sbin", "locale-gen")) || exists(c.tpath("usr", "bin", "locale-gen")) {
			if err := c.chroot("locale-gen"); err != nil {
				c.logf("locale-gen failed (non-fatal): %v", err)
			}
		}
	}

	// Timezone
	if c.plan.Region != "" && c.plan.Zone != "" {
		tz := c.plan.Region + "/" + c.plan.Zone
		if exists(c.tpath("usr", "share", "zoneinfo", c.plan.Region, c.plan.Zone)) {
			os.Remove(c.tpath("etc", "localtime"))
			if err := os.Symlink("/usr/share/zoneinfo/"+tz, c.tpath("etc", "localtime")); err != nil {
				c.logf("localtime symlink not created: %v", err)
			}
			os.WriteFile(c.tpath("etc", "timezone"), []byte(tz+"\n"), 0644)
		}
	}
	return nil
}

func runKeyboard(c *ctx) error {
	layout := c.plan.KbdLayout
	if layout == "" {
		layout = "us"
	}
	kbdModel := c.plan.KbdModel
	if kbdModel == "" {
		kbdModel = "pc105"
	}

	// Stile Debian: /etc/default/keyboard
	if exists(c.tpath("etc", "default")) {
		conf := fmt.Sprintf("XKBMODEL=%q\nXKBLAYOUT=%q\nXKBVARIANT=\"\"\nXKBOPTIONS=\"\"\n\nBACKSPACE=\"guess\"\n", kbdModel, layout)
		os.WriteFile(c.tpath("etc", "default", "keyboard"), []byte(conf), 0644)
	}

	// Console: /etc/vconsole.conf (per i layout comuni keymap = layout xkb)
	os.WriteFile(c.tpath("etc", "vconsole.conf"), []byte("KEYMAP="+layout+"\n"), 0644)

	// X11: /etc/X11/xorg.conf.d/00-keyboard.conf (Arch, Fedora, openSUSE)
	if exists(c.tpath("etc", "X11")) {
		dir := c.tpath("etc", "X11", "xorg.conf.d")
		os.MkdirAll(dir, 0755)
		conf := fmt.Sprintf(`Section "InputClass"
        Identifier "system-keyboard"
        MatchIsKeyboard "on"
        Option "XkbLayout" "%s"
        Option "XkbModel" "%s"
EndSection
`, layout, kbdModel)
		os.WriteFile(dir+"/00-keyboard.conf", []byte(conf), 0644)
	}
	return nil
}
