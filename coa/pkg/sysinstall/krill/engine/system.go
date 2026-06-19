// Moduli di configurazione del sistema installato: unpackfs, machineid,
// fstab, locale/timezone e tastiera.
package engine

import (
	"fmt"
	"os"
	"os/exec"
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

	rootOptions := "defaults,noatime"
	if plan.FsType == "btrfs" {
		rootOptions = "defaults"
	}

	lines := []string{
		"# /etc/fstab - generato da krill (oa-tools)",
		fmt.Sprintf("UUID=%s / %s %s 0 1", c.uuidOf(l.Root), plan.FsType, rootOptions),
	}
	if l.Esp != "" {
		lines = append(lines, fmt.Sprintf("UUID=%s /boot/efi vfat defaults,umask=0077 0 2", c.uuidOf(l.Esp)))
	}
	if l.Swap != "" {
		lines = append(lines, fmt.Sprintf("UUID=%s none swap sw 0 0", c.uuidOf(l.Swap)))
	}
	if plan.Swap == "file" {
		if err := c.makeSwapfile(); err != nil {
			return err
		}
		lines = append(lines, "/swapfile none swap sw 0 0")
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

// makeSwapfile crea /swapfile da 2GiB nel target.
func (c *ctx) makeSwapfile() error {
	swapfile := c.tpath("swapfile")
	if err := c.run("fallocate", "-l", "2G", swapfile); err != nil {
		// fallback per filesystem senza fallocate
		if err := c.run("dd", "if=/dev/zero", "of="+swapfile, "bs=1M", "count=2048"); err != nil {
			return err
		}
	}
	if err := os.Chmod(swapfile, 0600); err != nil {
		return err
	}
	return c.run("mkswap", swapfile)
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
