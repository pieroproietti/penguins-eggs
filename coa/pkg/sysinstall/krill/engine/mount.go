// Mount del target e dei filesystem di sistema necessari al chroot,
// più lo smontaggio finale in ordine inverso.
package engine

import (
	"os"
	"path/filepath"
)

func runMount(c *ctx) error {
	plan := c.plan
	l := partsFor(plan)

	if err := os.MkdirAll(plan.Target, 0755); err != nil {
		return err
	}

	if plan.FsType == "btrfs" {
		// 1. Crea un mount point temporaneo per la root btrfs e crea i subvol
		tmpMount := "/tmp/btrfs-temp-mount"
		if err := os.MkdirAll(tmpMount, 0755); err != nil {
			return err
		}
		if err := c.run("mount", l.Root, tmpMount); err != nil {
			return err
		}

		subvols := []string{"@", "@home", "@cache", "@log", "@snapshots"}
		if plan.Swap == "file" {
			subvols = append(subvols, "@swap")
		}

		for _, sv := range subvols {
			svPath := filepath.Join(tmpMount, sv)
			if !exists(svPath) {
				if err := c.run("btrfs", "subvolume", "create", svPath); err != nil {
					c.run("umount", tmpMount)
					return err
				}
			}
		}

		if err := c.run("umount", tmpMount); err != nil {
			return err
		}
		os.Remove(tmpMount)

		// Opzioni di mount standard per BTRFS
		opts := "defaults"
		if plan.TableType == "gpt" {
			opts = "defaults,compress=zstd:1"
		}

		// 2. Monta il subvolume root (@) sul target
		if err := c.mount("-o", "subvol=@,"+opts, l.Root, plan.Target); err != nil {
			return err
		}

		// 3. Crea le directory e monta gli altri subvol
		type btrfsMount struct {
			subvol string
			path   string
		}

		mounts := []btrfsMount{
			{"@home", c.tpath("home")},
			{"@cache", c.tpath("var", "cache")},
			{"@log", c.tpath("var", "log")},
			{"@snapshots", c.tpath(".snapshots")},
		}
		if plan.Swap == "file" {
			mounts = append(mounts, btrfsMount{"@swap", c.tpath("swap")})
		}

		for _, m := range mounts {
			if err := os.MkdirAll(m.path, 0755); err != nil {
				return err
			}
			if err := c.mount("-o", "subvol="+m.subvol+","+opts, l.Root, m.path); err != nil {
				return err
			}
		}
	} else {
		if err := c.mount("-t", plan.FsType, l.Root, plan.Target); err != nil {
			return err
		}
	}

	if l.Esp != "" {
		espDir := c.tpath("boot", "efi")
		if err := os.MkdirAll(espDir, 0755); err != nil {
			return err
		}
		if err := c.mount(l.Esp, espDir); err != nil {
			return err
		}
	}
	return nil
}

// mount esegue il mount e lo registra per lo smontaggio inverso.
func (c *ctx) mount(args ...string) error {
	mountPoint := args[len(args)-1]
	if err := c.run("mount", args...); err != nil {
		return err
	}
	c.mounts = append(c.mounts, mountPoint)
	return nil
}

// ensureChrootMounts monta i filesystem di sistema dentro il target
// (la lista rispecchia gli extraMounts di mount.conf). È idempotente:
// viene chiamata dal primo modulo che ha bisogno del chroot.
func (c *ctx) ensureChrootMounts() error {
	proc := c.tpath("proc")
	for _, m := range c.mounts {
		if m == proc {
			return nil // già fatto
		}
	}

	type sysMount struct {
		args []string
		dir  string
	}
	mounts := []sysMount{
		{[]string{"-t", "proc", "proc"}, c.tpath("proc")},
		{[]string{"-t", "sysfs", "sys"}, c.tpath("sys")},
		{[]string{"--bind", "/dev"}, c.tpath("dev")},
		{[]string{"-t", "devpts", "devpts"}, c.tpath("dev", "pts")},
		{[]string{"-t", "tmpfs", "tmpfs"}, c.tpath("run")},
	}
	if exists("/run/udev") {
		mounts = append(mounts, sysMount{[]string{"--bind", "/run/udev"}, c.tpath("run", "udev")})
	}
	if exists("/sys/firmware/efi/efivars") {
		mounts = append(mounts, sysMount{[]string{"-t", "efivarfs", "efivarfs"}, c.tpath("sys", "firmware", "efi", "efivars")})
	}

	for _, m := range mounts {
		if err := os.MkdirAll(m.dir, 0755); err != nil {
			return err
		}
		if err := c.mount(append(m.args, m.dir)...); err != nil {
			return err
		}
	}
	return nil
}

// runUmount smonta tutto in ordine inverso. Gli errori vengono solo
// loggati: a fine installazione meglio un umount pigro che un blocco.
func runUmount(c *ctx) error {
	for i := len(c.mounts) - 1; i >= 0; i-- {
		if err := c.run("umount", c.mounts[i]); err != nil {
			c.logf("umount %s failed, retrying lazy", c.mounts[i])
			c.run("umount", "-l", c.mounts[i])
		}
	}
	c.mounts = nil
	return nil
}

// runBtrfsPostFormatHook executes the mounting and subvolume creation hook for Btrfs targets.
func runBtrfsPostFormatHook(c *ctx, deviceRoot string, deviceBoot string, targetPath string, isBtrfs bool) error {
	if !isBtrfs {
		// Montaggio standard
		if err := os.MkdirAll(targetPath, 0755); err != nil {
			return err
		}
		return c.mount(deviceRoot, targetPath)
	}

	const tempRawMount = "/mnt/krill_temp_raw"

	// 1. Monta temporaneamente il blocco appena formattato
	if err := os.MkdirAll(tempRawMount, 0755); err != nil {
		return err
	}
	if err := c.run("mount", deviceRoot, tempRawMount); err != nil {
		return err
	}

	// 2. Crea i subvolumi @ e @home
	subvols := []string{"@", "@home"}
	for _, sv := range subvols {
		svPath := filepath.Join(tempRawMount, sv)
		if !exists(svPath) {
			if err := c.run("btrfs", "subvolume", "create", svPath); err != nil {
				_ = c.run("umount", tempRawMount)
				return err
			}
		}
	}

	// 3. Smonta il blocco raw
	if err := c.run("umount", tempRawMount); err != nil {
		return err
	}
	_ = os.Remove(tempRawMount)

	// 4. Monta il subvolume @ come root ufficiale per il processo successivo
	if err := os.MkdirAll(targetPath, 0755); err != nil {
		return err
	}
	// Registra il mount tramite c.mount così verrà smontato a fine installazione
	if err := c.mount("-o", "subvol=@", deviceRoot, targetPath); err != nil {
		return err
	}

	// 5. Crea e monta la cartella di boot (se separata)
	if deviceBoot != "" {
		bootDir := filepath.Join(targetPath, "boot")
		if err := os.MkdirAll(bootDir, 0755); err != nil {
			return err
		}
		if err := c.mount(deviceBoot, bootDir); err != nil {
			return err
		}
	}

	return nil
}
